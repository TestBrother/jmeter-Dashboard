# Install Database

The following guidelines should be followed when attempting to create a database to work with this project.

## Requirements

1. A LAMP Stack
2. Access on PORTS 22 & 80 to this machine
3. Setup Webserver
4. Configure Connection Settings

## The LAMP Stack
MySQL, Apache and PHP are required to be installed on a simple Linux server. This only needs ot be a standard LAMP stack, no special settings are required.

Create a blank database.
Create a new user, *a password is required, the scripts will not work without one*.

## Access
Security settings should be amended to allow access on ports 22 (admin) & 80 (to view the site).

## Setup webserver.
Source files [here](https://github.com/newsinternational/JVisualiser).

These should be copied to the server directory for Apache on this machine.

## Configure Connection Settings
Open the file `/assets/js/jvisualiser.js`

At the top of this file, replace the values:

    var cDBNAME='mydatabasename', cDBPASS='mypassword'

With the correct settings for your database.

Then, on your local machine, open the file `jmeter-ec2.properties` that was installed as part of the [jmeter-ec2 script](http://www.http503.com/2012/run-jmeter-on-amazon-ec2-cloud/). At the bottom of this file edit:

    # DATABASE SETTINGS
    # If specified, then the script will import the results to the mysql database given here
    DB_HOST="YOURIP"
    DB_NAME="YOURDBNAME"
    DB_USER="YOURDBUSERNAME"
    DB_PSWD="YOURDBPASSWORD"
    DB_PEM_FILE="KEY FILE TO YOUR LAMP STACK.pem"
    DB_PEM_PATH="/PATH/TO/YOUR/FILE" 
    DB_PEM_USER="USERNAME FOR YOUR LAMP STACK"

