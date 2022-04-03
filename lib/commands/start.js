/**
 * External dependencies
 */
const dockerCompose = require( 'docker-compose' );
const util = require( 'util' );
const path = require( 'path' );
const fs = require( 'fs' ).promises;
const inquirer = require( 'inquirer' );

/**
 * Promisified dependencies
 */
const sleep = util.promisify( setTimeout );
const rimraf = util.promisify( require( 'rimraf' ) );
const exec = util.promisify( require( 'child_process' ).exec );

/**
 * Internal dependencies
 */
const retry = require( '../retry' );
const stop = require( './stop' );
const initConfig = require( '../init-config' );
const {
	checkDatabaseConnection,
	configureWordPress,
} = require( '../wordpress' );
const { didCacheChange, setCache } = require( '../cache' );
const md5 = require( '../md5' );
const htaccessWriter = require( '../htaccess' );
const htaccessExists = require( '../htaccess' );

/**
 * @typedef {import('../config').Config} Config
 */
const CONFIG_CACHE_KEY = 'config_checksum';

/**
 * Starts the development server.
 *
 * @param {Object}  options
 * @param {Object}  options.spinner A CLI spinner which indicates progress.
 * @param {boolean} options.debug   True if debug mode is enabled.
 * @param {boolean} options.update  If true, update sources.
 * @param {string}  options.xdebug  The Xdebug mode to set.
 */
module.exports = async function start( { spinner, debug, update, xdebug } ) {
	spinner.text = 'Reading configuration.';
	await checkForLegacyInstall( spinner );

	const config = await initConfig( {
		spinner,
		debug,
		xdebug,
		writeChanges: true,
	} );

	if ( ! config.detectedLocalConfig ) {
		const { configDirectoryPath } = config;
		spinner.warn(
			`Warning: could not find a .wp-env.json configuration file, no extra variables will be set.`
		);
		spinner.start();
	}

	const addIndexFile = async () => {
		spinner.text = 'Adding missing `index.php` file.';

		await fs.writeFile(
			path.join( process.cwd(), 'index.php' ),
			'<?php // Silence is golden.',
			() => {
				throw new Error(
					'Unable to write a new default `index.php` file in the project root, this file must exist.'
				);
			}
		)
	}

	// Check that an `index.php` file exists to stop adding lots of files to the project root.
	await fs.stat( path.join( process.cwd(), 'index.php' ) ).catch( () => addIndexFile() );

	// Check if the hash of the config has changed. If so, run configuration.
	const configHash = md5( config );
	const { workDirectoryPath, dockerComposeConfigPath } = config;
	const shouldConfigureWp =
		update ||
		( await didCacheChange( CONFIG_CACHE_KEY, configHash, {
			workDirectoryPath,
		} ) );

	const dockerComposeConfig = {
		config: dockerComposeConfigPath,
		log: config.debug,
	};

	/**
	 * Files that are automatically added whenever the Docker image is started.
	 *
	 * The defined files here will be checked for in the project root,
	 * and removed if found.
	 *
	 * @type {string[]}
	 */
	const defaultFilesToRemove = [
		'wp-config.php',
		'phpunit-wp-config.php',
	];

	/**
	 * If the Docker image is already running and the `wp-env` files have been
	 * deleted, the start command will not complete successfully. Stopping
	 * the container before continuing allows the docker entrypoint script,
	 * which restores the files, to run again when we start the containers.
	 *
	 * Additionally, this serves as a way to restart the container entirely
	 * should the need arise.
	 *
	 * @see https://github.com/WordPress/gutenberg/pull/20253#issuecomment-587228440
	 */
	if ( shouldConfigureWp ) {
		await stop( { spinner, debug } );
		// Update the images before starting the services again.
		spinner.text = 'Updating docker images.';

		const directoryHash = path.basename( workDirectoryPath );

		// Note: when the base docker image is updated, we want that operation to
		// also update WordPress. Since we store wordpress/tests-wordpress files
		// as docker volumes, simply updating the image will not change those
		// files. Thus, we need to remove those volumes in order for the files
		// to be updated when pulling the new images.
		const volumesToRemove = `${ directoryHash }_wordpress`;

		try {
			if ( config.debug ) {
				spinner.text = `Removing the WordPress volumes: ${ volumesToRemove }`;
			}
			await exec( `docker volume rm ${ volumesToRemove }` );
		} catch {
			// Note: we do not care about this error condition because it will
			// mostly happen when the volume already exists. This error would not
			// stop wp-env from working correctly.
		}

		await dockerCompose.pullAll( dockerComposeConfig );
		spinner.text = 'Downloading sources.';
	}

	await Promise.all( [
		dockerCompose.upOne( 'mysql', {
			...dockerComposeConfig,
			commandOptions: shouldConfigureWp
				? [ '--build', '--force-recreate' ]
				: [],
		} )
	] );

	if ( ! htaccessExists( config.env.development.publicDirectory ) ) {
		spinner.text = 'Generating `.htaccess` file.';

		htaccessWriter( config.env.development.publicDirectory, false );
	}

	spinner.text = 'Starting WordPress.';

	await dockerCompose.upMany( [ 'wordpress' ], {
		...dockerComposeConfig,
		commandOptions: shouldConfigureWp
			? [ '--build', '--force-recreate' ]
			: [],
	} );

	// Only run WordPress install/configuration when config has changed.
	if ( shouldConfigureWp ) {
		spinner.text = 'Configuring WordPress.';

		try {
			await checkDatabaseConnection( config );
		} catch ( error ) {
			// Wait 30 seconds for MySQL to accept connections.
			await retry( () => checkDatabaseConnection( config ), {
				times: 30,
				delay: 1000,
			} );

			// It takes 3-4 seconds for MySQL to be ready after it starts accepting connections.
			await sleep( 4000 );
		}

		// Retry WordPress installation in case MySQL *still* wasn't ready.
		await Promise.all( [
			retry( () => configureWordPress( 'development', config, spinner ), {
				times: 2,
			} ),
		] );

		// Set the cache key once everything has been configured.
		await setCache( CONFIG_CACHE_KEY, configHash, {
			workDirectoryPath,
		} );
	}

	spinner.text = 'Removing default files.';
	try {
		defaultFilesToRemove.forEach( ( file ) => {
			let filePath = path.join( process.cwd(), file );

			fs.unlink( filePath );
		} );
	} catch ( error ) {
		spinner.warn( 'Unable to automatically remove some default files.' );
	}

	const siteUrl = config.env.development.config.WP_SITEURL;

	const { out: mySQLAddress } = await dockerCompose.port(
		'mysql',
		3306,
		dockerComposeConfig
	);
	const mySQLPort = mySQLAddress.split( ':' ).pop();

	spinner.prefixText = 'WordPress development site started'
		.concat( siteUrl ? ` at ${ siteUrl }` : '.' )
		.concat( '\n' )
		.concat( `MySQL is listening on port ${ mySQLPort }` )
		.concat( '\n' );

	spinner.text = 'Done!';
};

/**
 * Checks for legacy installs and provides
 * the user the option to delete them.
 *
 * @param {Object} spinner A CLI spinner which indicates progress.
 */
async function checkForLegacyInstall( spinner ) {
	const basename = path.basename( process.cwd() );
	const installs = [
		`../${ basename }-wordpress`,
	];
	await Promise.all(
		installs.map( ( install ) =>
			fs
				.access( install )
				.catch( () =>
					installs.splice( installs.indexOf( install ), 1 )
				)
		)
	);
	if ( ! installs.length ) {
		return;
	}

	spinner.info(
		`It appears that you have used a previous version of this tool where installs were kept in ${ installs.join(
			' and '
		) }. Installs are now in your home folder.\n`
	);
	const { yesDelete } = await inquirer.prompt( [
		{
			type: 'confirm',
			name: 'yesDelete',
			message:
				'Do you wish to delete these old installs to reclaim disk space?',
			default: true,
		},
	] );
	if ( yesDelete ) {
		await Promise.all( installs.map( ( install ) => rimraf( install ) ) );
		spinner.info( 'Old installs deleted successfully.' );
	}
	spinner.start();
}
