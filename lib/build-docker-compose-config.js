'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { dbEnv } = require( './config' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 */

/**
 * Gets the volume mounts for an individual service.
 *
 * @param {WPServiceConfig} config           The service config to get the mounts from.
 * @param {string}          wordpressDefault The default internal path for the WordPress
 *                                           source code (such as tests-wordpress).
 *
 * @return {string[]} An array of volumes to mount in string format.
 */
function getMounts( config, wordpressDefault = 'wordpress' ) {
	// Top-level WordPress directory mounts (like wp-content/themes)
	const directoryMounts = Object.entries( config.mappings ).map(
		( [ wpDir, source ] ) => {
			if ( '/' === source.path.charAt(0) ) {
				// If the first character is a path denominator, allow full system mapping.
				return `${source.path}:${wpDir}`
			} else {
				// If not, make it a relative path to the project root.
				return `${source.path}:/var/www/html/${wpDir}`
			}
		}
	);

	const coreMount = `${ process.cwd() }:/var/www/html`;

	return [
		...new Set( [
			coreMount,
			...directoryMounts,
		] ),
	];
}

/**
 * Creates a docker-compose config object which, when serialized into a
 * docker-compose.yml file, tells docker-compose how to run the environment.
 *
 * @param {WPConfig} config A wp-env config object.
 *
 * @return {Object} A docker-compose config object, ready to serialize into YAML.
 */
module.exports = function buildDockerComposeConfig( config ) {
	const developmentMounts = getMounts( config.env.development );

	// Set the default ports based on the config values.
	const developmentPorts = `\${WP_ENV_PORT:-${ config.env.development.port }}:80`;

	// Set the WordPress, WP-CLI, PHPUnit PHP version if defined.
	const developmentPhpVersion = config.env.development.phpVersion
		? config.env.development.phpVersion
		: '';

	// Set the WordPress images with the PHP version tag.
	const developmentWpImage = `wordpress${
		developmentPhpVersion ? ':php' + developmentPhpVersion : ''
	}`;
	// Set the WordPress CLI images with the PHP version tag.
	const developmentWpCliImage = `wordpress:cli${
		! developmentPhpVersion || developmentPhpVersion.length === 0
			? ''
			: '-php' + developmentPhpVersion
	}`;

	// The www-data user in wordpress:cli has a different UID (82) to the
	// www-data user in wordpress (33). Ensure we use the wordpress www-data
	// user for CLI commands.
	// https://github.com/docker-library/wordpress/issues/256
	const cliUser = '33:33';

	return {
		version: '3.7',
		services: {
			mysql: {
				image: 'mariadb',
				ports: [ '3306' ],
				environment: {
					MYSQL_ROOT_PASSWORD:
						dbEnv.credentials.WORDPRESS_DB_PASSWORD,
					MYSQL_DATABASE: dbEnv.development.WORDPRESS_DB_NAME,
				},
				volumes: [ 'mysql:/var/lib/mysql' ],
			},
			wordpress: {
				build: '.',
				depends_on: [ 'mysql' ],
				image: developmentWpImage,
				ports: [ developmentPorts ],
				environment: {
					...dbEnv.credentials,
					...dbEnv.development,
				},
				volumes: developmentMounts,
			},
			cli: {
				depends_on: [ 'wordpress' ],
				image: developmentWpCliImage,
				volumes: developmentMounts,
				user: cliUser,
				environment: {
					...dbEnv.credentials,
					...dbEnv.development,
				},
			},
			composer: {
				image: 'composer',
				volumes: [ `${ config.configDirectoryPath }:/app` ],
			},
		},
		volumes: {
			mysql: {},
		},
	};
};
