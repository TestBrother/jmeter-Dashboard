# jmeter-graphs

jmeter-graphs is the source code for a presentation layer providing visualisations of jmeter test results.

##High Level Installation Instructions

1. Create a LAMP stack with:

- Linux (Ubuntu)
- Apache
- MySql
- PHP5

2. Create a DB, eg. using the name `jresults` as shown in the properties file below

3. Create a db user with access to this db.

4. Create a webserver serving the php files in this project

5. Optionally setup DNS access to this address

6. Make sure the local webserver has access to the MySql database

7. From the jmeter-ec2 shell script, configure the jmeter-ec2.properties file to look like:

    `DATABASE SETTINGS`

    `DB_HOST="[IP ADDRESS / HOST]"` - [An elastic IP or the hostname to the server]

    `DB_NAME="jresults"` [database name]

    `DB_USER="DBUSER"` [database user]

    `DB_PSWD="DBPASSWORD"` [database password]

    `DB_PEM_FILE="jmeter-ec2.pem"` [pem file to access LAMP server]

    `DB_PEM_PATH="/Users/oliver/.ec2" ` [path to pem file]

    `DB_PEM_USER="ubuntu"` [user name to use with pem file]


8. When the site is first opened in a browser on a machine, update the Settings tab with the DB connection details. This saves these values to locaStorage.

9. Ensure that the machine that you run the script on has access on port 22 to this server and to the database - you may need to update permissions in mysql.