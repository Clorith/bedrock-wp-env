# `bedrock-wp-env`

This is a fork of the WordPress plugin/theme development environment, [`wp-env`](https://github.com/WordPress/gutenberg/tree/trunk/packages/env), which lets you easily set up a local WordPress environment for building and testing plugins and themes. It's simple to install and requires no configuration.

The fork allows you to use the environment for your bedrock setup, where plugins, themes, and WordPress core, are all maintained as part of a version controlled environment.

## Quick (tl;dr) instructions

Ensure that Docker is running, then:

```sh
$ cd /path/to/wordpress/project
$ npm -g i Clorith/bedrock-wp-env
$ bedrock-wp-env start
```

The local environment will be available at http://localhost:8888 (Username: `admin`, Password: `password`).

## Prerequisites

`bedrock-wp-env` requires Docker to be installed. There are instructions available for installing Docker on [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other versions of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script).

Node.js and NPM are required. The latest LTS version of Node.js is used to develop `wp-env` and is recommended.

Your bedrock installation also needs a `index.php` file in the root directory, this is to prevent additional core files form being downloaded, this is an unfortunate side-effect, as of now, to the Docker images used.

You will want to add the following files to your `.gitignore` file, as they are always automatically generated by the Docker image;

- `./wp-config.php`
- `./phpunit-wp-config.php`

## Installation

### Installation as a global package

After confirming that the prerequisites are installed, you can install `bedrock-wp-env` globally like so:

```sh
$ npm -g i Clorith/bedrock-wp-env
```

You're now ready to use `bedrock-wp-env`!

### Installation as a local package

If your project already has a package.json, it's also possible to use `wp-env` as a local package. First install `wp-env` locally as a dev dependency:

```sh
$ npm i Clorith/bedrock-wp-env --save-dev
```

Then modify your package.json and add an extra command to npm `scripts` (https://docs.npmjs.com/misc/scripts):

```json
"scripts": {
	"bedrock-wp-env": "bedrock-wp-env"
}
```

When installing `bedrock-wp-env` in this way, all `bedrock-wp-env` commands detailed in these docs must be prefixed with `npm run`, for example:

```sh
# You must add another double dash to pass the "update" flag to wp-env
$ npm run bedrock-wp-env start -- --update
```

instead of:

```sh
$ bedrock-wp-env start --update
```

## Usage

### Starting the environment

First, ensure that Docker is running. You can do this by clicking on the Docker icon in the system tray or menu bar.

Then, change to a directory that contains a WordPress project with a Bedrock structure:

```sh
$ cd ~/my-website
```

Then, start the local environment:

```sh
$ bedrock-wp-env start
```

Finally, navigate to http://localhost:8888 in your web browser to see WordPress running with the local WordPress plugin or theme running and activated. Default login credentials are username: `admin` password: `password`.

### Stopping the environment

To stop the local environment:

```sh
$ bedrock-wp-env stop
```

## Troubleshooting common problems

Many common problems can be fixed by running through the following troubleshooting steps in order:

### 1. Check that `bedrock-wp-env` is running

First, check that `bedrock-wp-env` is running. One way to do this is to have Docker print a table with the currently running containers:

```sh
$ docker ps
```

In this table, by default, you should see two entries: `wordpress` with port 8888 and `mariadb` with port 3306.

### 2. Check the port number

By default `bedrock-wp-env` uses port 8888, meaning that the local environment will be available at http://localhost:8888.

You can configure the port that `bedrock-wp-env` uses so that it doesn't clash with another server by specifying the `WP_ENV_PORT` environment variable when starting `bedrock-wp-env`:

```sh
$ WP_ENV_PORT=3333 wp-env start
```

Running `docker ps` and inspecting the `PORTS` column allows you to determine which port `bedrock-wp-env` is currently using.

You may also specify the port numbers in your `.wp-env.json` file, but the environment variables take precedent.

### 3. Restart `bedrock-wp-env`

Restarting `bedrock-wp-env` will restart the underlying Docker containers which can fix many issues.

To restart `bedrock-wp-env`:

```sh
$ bedrock-wp-env stop
$ bedrock-wp-env start
```

### 4. Restart Docker

Restarting Docker will restart the underlying Docker containers and volumes which can fix many issues.

To restart Docker:

1. Click on the Docker icon in the system tray or menu bar.
2. Select _Restart_.

Once restarted, start `bedrock-wp-env` again:

```sh
$ bedrock-wp-env start
```

### 5. Reset the database

Resetting the database which the local environment uses can fix many issues, especially when they are related to the WordPress installation.

To reset the database:

**⚠️ WARNING: This will permanently delete any posts, pages, media, etc. in the local WordPress installation.**

```sh
$ bedrock-wp-env clean all
$ bedrock-wp-env start
```

### 6. Nuke everything and start again 🔥

When all else fails, you can use `bedrock-wp-env destroy` to forcibly remove all of the underlying Docker containers and volumes. This will allow you to start from scratch.

To nuke everything:

**⚠️ WARNING: This will permanently delete any posts, pages, media, etc. in the local WordPress installation.**

```sh
$ bedrock-wp-env destroy
$ bedrock-wp-env start
```

### 7. Debug mode and inspecting the generated dockerfile.

`bedrock-wp-env` uses docker behind the scenes. Inspecting the generated docker-compose file can help to understand what's going on.

Start `bedrock-wp-env` in debug mode

```sh
bedrock-wp-env start --debug
```

`bedrock-wp-env` will output its config which includes `dockerComposeConfigPath`.

```sh
ℹ Config:
	...
	"dockerComposeConfigPath": "/Users/$USERNAME/.wp-env/5a619d332a92377cd89feb339c67b833/docker-compose.yml",
	...
```

## Using Xdebug

Xdebug is installed in the wp-env environment, but it is turned off by default. To enable Xdebug, you can use the `--xdebug` flag with the `wp-env start` command. Here is a reference to how the flag works:

```sh
# Sets the Xdebug mode to "debug" (for step debugging):
bedrock-wp-env start --xdebug

# Sets the Xdebug mode to "off":
bedrock-wp-env start

# Enables each of the Xdebug modes listed:
bedrock-wp-env start --xdebug=profile,trace,debug
```

When you're running `bedrock-wp-env` using `npm run`, like when working in the Gutenberg repo or when having `bedrock-wp-env` as a local project dependency, don't forget to add an extra double dash before the `--xdebug` command:

```sh
bedrock-npm run wp-env start -- --xdebug
```

If you forget about that, the `--xdebug` parameter will be passed to NPM instead of the `wp-env start` command and it will be ignored.

You can see a reference on each of the Xdebug modes and what they do in the [Xdebug documentation](https://xdebug.org/docs/all_settings#mode).

_Since we are only installing Xdebug 3, Xdebug is only supported for PHP versions greater than or equal to 7.2 (the default). Xdebug won't be installed if `phpVersion` is set to a legacy version._

### Xdebug IDE support

To connect to Xdebug from your IDE, you can use these IDE settings. This bit of JSON was tested for VS Code's `launch.json` format (which you can [learn more about here](https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes)) along with [this PHP Debug extension](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug). Its path mapping also points to a specific plugin -- you should update this to point to the source you are working with inside of the wp-env instance.

You should only have to translate `port` and `pathMappings` to the format used by your own IDE.

```json
{
  "name": "Listen for XDebug",
  "type": "php",
  "request": "launch",
  "port": 9003,
  "pathMappings": {
    "/var/www/html/wp-content/plugins/gutenberg": "${workspaceFolder}/"
  }
}
```

After you create a `.vscode/launch.json` file in your repository, you probably want to add it to your [global gitignore file](https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files#configuring-ignored-files-for-all-repositories-on-your-computer) so that it stays private for you and is not committed to the repository.

Once your IDEs Xdebug settings have been enabled, you should just have to launch the debugger, put a breakpoint on any line of PHP code, and then refresh your browser!

Here is a summary:

1. Start bedrock-wp-env with xdebug enabled: `bedrock-wp-env start --xdebug`
2. Install a suitable Xdebug extension for your IDE if it does not include one already.
3. Configure the IDE debugger to use port `9003` and the correct source files in bedrock-wp-env.
4. Launch the debugger and put a breakpoint on any line of PHP code.
5. Refresh the URL bedrock-wp-env is running at and the breakpoint should trigger.

## Command reference

`bedrock-wp-env` creates generated files in the `bedrock-wp-env` home directory. By default, this is `~/.wp-env`. The exception is Linux, where files are placed at `~/wp-env` [for compatibility with Snap Packages](https://github.com/WordPress/gutenberg/issues/20180#issuecomment-587046325). The `wp-env` home directory contains a subdirectory for each project named `/$md5_of_project_path`. To change the `wp-env` home directory, set the `WP_ENV_HOME` environment variable. For example, running `WP_ENV_HOME="something" wp-env start` will download the project files to the directory `./something/$md5_of_project_path` (relative to the current directory).

### `bedrock-wp-env start`

The start command installs and initializes the WordPress environment, which includes downloading any specified remote sources. By default, `wp-env` will not update or re-configure the environment except when the configuration file changes. Tell `wp-env` to update sources and apply the configuration options again with `bedrock-wp-env start --update`. This will not overwrite any existing content.

```sh
bedrock-wp-env start

Starts WordPress for development on port 8888 (override with WP_ENV_PORT) and
tests on port 8889 (override with WP_ENV_TESTS_PORT). The current working
directory must be a WordPress installation, a plugin, a theme, or contain a
.wp-env.json file. After first install, use the '--update' flag to download
updates to mapped sources and to re-apply WordPress configuration options.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --debug    Enable debug output.                     [boolean] [default: false]
  --update   Download source updates and apply WordPress configuration.
                                                      [boolean] [default: false]
  --xdebug   Enables Xdebug. If not passed, Xdebug is turned off. If no modes
             are set, uses "debug". You may set multiple Xdebug modes by passing
             them in a comma-separated list: `--xdebug=develop,coverage`. See
             https://xdebug.org/docs/all_settings#mode for information about
             Xdebug modes.                                              [string]
```

### `bedrock-wp-env stop`

```sh
bedrock-wp-env stop

Stops running WordPress for development and tests and frees the ports.
```

### `bedrock-wp-env clean [environment]`

```sh
bedrock-wp-env clean [environment]

Cleans the WordPress databases.

Positionals:
  environment  Which environments' databases to clean.
            [string] [choices: "all", "development", "tests"] [default: "tests"]
```

### `bedrock-wp-env run [container] [command]`

The run command can be used to open shell sessions or invoke WP-CLI commands.

<div class="callout callout-alert">
To run a WP-CLI command that includes optional arguments, enclose the WP-CLI command in quotation marks; otherwise, the optional arguments are ignored. This is because flags are normally passed to `wp-env` itself, meaning that the flags are not considered part of the argument that specifies the WP-CLI command. With quotation marks, `wp-env` considers everything inside quotation marks the WP-CLI command argument.

For example, to list cron schedules with optional arguments that specify the fields returned and the format of the output:

```sh
bedrock-wp-env run cli "wp cron schedule list --fields=name --format=csv"
```

Without the quotation marks, WP-CLI lists the schedule in its default format, ignoring the `fields` and `format` arguments.
</div>

Note that quotation marks are not required for a WP-CLI command that excludes optional arguments, although it does not hurt to include them. For example, the following command syntaxes return identical results: `wp-env run cli "wp cron schedule list"` or `wp-env run cli wp cron schedule list`.

For more information about all the available commands, see [WP-CLI Commands](https://developer.wordpress.org/cli/commands/).

```sh
bedrock-wp-env run <container> [command..]

Runs an arbitrary command in one of the underlying Docker containers. The
"container" param should reference one of the underlying Docker services like
"development", or "cli". To run a wp-cli command, use the "cli" service. 
You can also use this command to open shell sessions like
bash and the WordPress shell in the WordPress instance. For example, `bedrock-wp-env run
cli bash` will open bash in the development WordPress instance. When using long
commands with arguments and quotation marks, you need to wrap the "command"
param in quotation marks. For example: `bedrock-wp-env run cli "wp post create
--post_type=page --post_title='Test'"` will create a post on the WordPress
instance.

Positionals:
  container  The container to run the command on.            [string] [required]
  command    The command to run.                           [array] [default: []]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --debug    Enable debug output.                     [boolean] [default: false]
```

For example:

#### Displaying the users on the development instance:

```sh
bedrock-wp-env run cli wp user list
⠏ Running `wp user list` in 'cli'.

ID      user_login      display_name    user_email      user_registered roles
1       admin   admin   wordpress@example.com   2020-03-05 10:45:14     administrator

✔ Ran `wp user list` in 'cli'. (in 2s 374ms)
```

#### Opening the WordPress shell on the development instance and running PHP commands:

```sh
bedrock-wp-env run cli wp shell
ℹ Starting 'wp shell' on the cli container. Exit the WordPress shell with ctrl-c.

Starting 31911d623e75f345e9ed328b9f48cff6_mysql_1 ... done
Starting 31911d623e75f345e9ed328b9f48cff6_tests-wordpress_1 ... done
wp> echo( 'hello world!' );
hello world!
wp> ^C
✔ Ran `wp shell` in 'cli'. (in 16s 400ms)
```

#### Installing a plugin or theme on the development instance

```sh
bedrock-wp-env run cli wp plugin install custom-post-type-ui

Creating 500cd328b649d63e882d5c4695871d04_cli_run ... done
Installing Custom Post Type UI (1.9.2)
Downloading installation package from https://downloads.wordpress.org/plugin/custom-post-type-ui.zip...
The authenticity of custom-post-type-ui.zip could not be verified as no signature was found.
Unpacking the package...
Installing the plugin...
Plugin installed successfully.
Success: Installed 1 of 1 plugins.
✔ Ran `plugin install custom-post-type-ui` in 'cli'. (in 6s 483ms)
```

**NOTE**: Depending on your host OS, you may experience errors when trying to install plugins or themes (e.g. `Warning: Could not create directory.`). This is typically because the user ID used within the container does not have write access to the mounted directories created by `wp-env`. To resolve this, run the `docker-compose` command directly from the directory created by `wp-env` and add `-u $(id -u)` and `-e HOME=/tmp` the `run` command as options:

```sh
$ cd ~/wp-env/500cd328b649d63e882d5c4695871d04
$ docker-compose run --rm -u $(id -u) -e HOME=/tmp cli [plugin|theme] install <plugin|theme>
```

### `wp-env destroy`

```sh
bedrock-wp-env destroy

Destroy the WordPress environment. Deletes docker containers, volumes, and
networks associated with the WordPress environment and removes local files.
```

### `wp-env logs [environment]`

```sh
bedrock-wp-env logs

displays PHP and Docker logs for given WordPress environment.

Positionals:
  environment  Which environment to display the logs from.
      [string] [choices: "development", "tests", "all"] [default: "development"]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --debug    Enable debug output.                     [boolean] [default: false]
  --watch    Watch for logs as they happen.            [boolean] [default: true]
```

### `bedrock-wp-env install-path`

Outputs the absolute path to the WordPress environment files.

Example:

```sh
$ bedrock-wp-env install-path

/home/user/.wp-env/63263e6506becb7b8613b02d42280a49
```

## .wp-env.json

You can customize the WordPress installation, plugins and themes that the development environment will use by specifying a `.wp-env.json` file in the directory that you run `wp-env` from.

`.wp-env.json` supports six fields for options applicable to both the tests and development instances.

| Field          | Type           | Default                                | Description                                                                                                                      |
| -------------- | -------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `"phpVersion"` | `string\|null` | `null`                                 | The PHP version to use. If `null` is specified, `wp-env` will use the default version used with production release of WordPress. |
| `"port"`       | `integer`      | `8888` (`8889` for the tests instance) | The primary port number to use for the installation. You'll access the instance through the port: 'http://localhost:8888'.       |
| `"config"`     | `Object`       | See below.                             | Mapping of wp-config.php constants to their desired values.                                                                      |
| `"mappings"`   | `Object`       | `"{}"`                                 | Mapping of WordPress directories to local directories to be mounted in the WordPress instance.                                   |

_Note: the port number environment variables (`WP_ENV_PORT` and `WP_ENV_TESTS_PORT`) take precedent over the .wp-env.json values._

Several types of strings can be passed into the `mappings` field.

| Type              | Format                        | Example(s)                                               |
| ----------------- | ----------------------------- | -------------------------------------------------------- |
| Relative path     | `.<path>\|~<path>`            | `"./a/directory"`, `"../a/directory"`, `"~/a/directory"` |
| Absolute path     | `/<path>\|<letter>:\<path>`   | `"/a/directory"`, `"C:\\a\\directory"`                   |
| GitHub repository | `<owner>/<repo>[#<ref>]`      | `"WordPress/WordPress"`, `"WordPress/gutenberg#trunk"`   |
| ZIP File          | `http[s]://<host>/<path>.zip` | `"https://wordpress.org/wordpress-5.4-beta2.zip"`        |

Remote sources will be downloaded into a temporary directory located in `~/.wp-env`.

Additionally, the key `env` is available to override any of the above options on an individual-environment basis. For example, take the following `.wp-env.json` file:

```json
{
  "config": {
    "KEY_1": true,
    "KEY_2": false
  },
  "env": {
    "development": {
      "themes": ["./one-theme"]
    },
    "tests": {
      "config": {
        "KEY_1": false
      },
      "port": 3000
    }
  }
}
```

On the development instance, `cwd` will be mapped as a plugin, `one-theme` will be mapped as a theme, KEY_1 will be set to true, and KEY_2 will be set to false. Also note that the default port, 8888, will be used as well.

On the tests instance, `cwd` is still mapped as a plugin, but no theme is mapped. Additionally, while KEY_2 is still set to false, KEY_1 is overridden and set to false. 3000 overrides the default port as well.

This gives you a lot of power to change the options applicable to each environment.

## .wp-env.override.json

Any fields here will take precedence over .wp-env.json. This file is useful when ignored from version control, to persist local development overrides. Note that options like `plugins` and `themes` are not merged. As a result, if you set `plugins` in your override file, this will override all of the plugins listed in the base-level config. The only keys which are merged are `config` and `mappings`. This means that you can set your own wp-config values without losing any of the default values.

## Default wp-config values.

On the development instance, these wp-config values are defined by default:

```
WP_DEBUG: true,
SCRIPT_DEBUG: true,
WP_PHP_BINARY: 'php',
WP_TESTS_EMAIL: 'admin@example.org',
WP_TESTS_TITLE: 'Test Blog',
WP_TESTS_DOMAIN: 'http://localhost',
WP_SITEURL: 'http://localhost',
WP_HOME: 'http://localhost',
```

On the test instance, all of the above are still defined, but `WP_DEBUG` and `SCRIPT_DEBUG` are set to false.

Additionally, the values referencing a URL include the specified port for the given environment. So if you set `testsPort: 3000, port: 2000`, `WP_HOME` (for example) will be `http://localhost:3000` on the tests instance and `http://localhost:2000` on the development instance.

### Examples

#### Custom Port Numbers

You can tell `wp-env` to use a custom port number so that your instance does not conflict with other `wp-env` instances.

```json
{
  "plugins": ["."],
  "port": 4013
}
```

#### Specific PHP Version

You can tell `wp-env` to use a specific PHP version for compatibility and testing. This can also be set via the environment variable `WP_ENV_PHP_VERSION`.

```json
{
  "phpVersion": "7.2"
}
```

## Contributing to this package

This project is a fork of the `wp-env` project, which is part of the Gutenberg package, developed by contributors to the WordPress open source project (wow, that's a mouthfull, isn't it?).

It was forked due to a need for more flexibility in the projects supported, which are not covered by the original package, and all contributions are more than welcome.
