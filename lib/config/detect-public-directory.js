'use strict';
/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

module.exports = function detectPublicDirectory() {
    let publicFolder = null,
        availableFolders = [
            'web',
            'public'
        ];

    availableFolders.forEach( ( folder ) => {
        if ( fs.existsSync( path.join( process.cwd(), folder ) ) ) {
            publicFolder = folder;
        }
    } );

    return publicFolder;
}
