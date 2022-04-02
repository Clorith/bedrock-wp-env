// Username and password used in all databases.
const credentials = {
	WORDPRESS_DB_USER: 'root',
	WORDPRESS_DB_PASSWORD: 'password',
};

// Environment for development database. DB host gets default value which is set
// elsewhere.
const development = {
	WORDPRESS_DB_NAME: 'wordpress',
};

module.exports = {
	credentials,
	development,
};
