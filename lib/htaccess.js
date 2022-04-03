/**
 * External dependencies
 */
const path = require( 'path' );
const fs = require( 'fs' );

module.exports = function htaccessExists( directoryPath ) {
     return fs.existsSync( path.join( directoryPath, '.htaccess' ) );
}

module.exports = function htaccessWriter( directoryPath, multisite = false ) {
    let htaccessFilePath = path.join( directoryPath, '.htaccess' );
    let fileContents = {
        'single': `
# BEGIN WordPress

RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]

# END WordPress
        `,
        'multisite': `
# BEGIN WordPress Multisite
# Using subfolder network type: https://wordpress.org/support/article/htaccess/#multisite

RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]

# add a trailing slash to /wp-admin
RewriteRule ^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/ [R=301,L]

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]
RewriteRule . index.php [L]

# END WordPress Multisite
        `
    };

    fs.writeFileSync(
        path.join( htaccessFilePath ),
        ( multisite ? fileContents.multisite : fileContents.single )
    );
}
