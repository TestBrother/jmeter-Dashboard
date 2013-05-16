<?php
#
# 
#
# 
#
	$dbUser = $_POST["dbuser"];
	$dbPass = $_POST["dbpass"];
	$dbHost = $_POST["dbhost"];
	$dbName = $_POST["dbname"];

	$conn = mysql_connect($dbHost,$dbUser,$dbPass) or trigger_error("SQL", E_USER_ERROR);
	$db = mysql_select_db($dbName,$conn) or trigger_error("SQL", E_USER_ERROR);

    $testId = mysql_real_escape_string($_POST["test_id"]);
    $value = mysql_real_escape_string($_POST["value"]);
    $columnIndex = mysql_real_escape_string($_POST["column"]);

#
#	Column index
#
#	4 - buildlife
#	5 - project
#	6 - environment
#	7 - comment - currently only active with this column

	switch($columnIndex) {
		case '4' : {
			$columnText='buildlife';
		}
		break;
		case '5' : {
			$columnText='project';
		}
		break;
		case '6' : {
			$columnText='environment';
		}
		break;
		case '7' : {
			$columnText='comment';
		}
		break;
	}

	$queryUpdate = sprintf("UPDATE tests 
							SET %s = '%s'
							WHERE testid = %d",
							$columnText,
							$value,
							$testId);

	$resultUpdate = mysql_query($queryUpdate);	

	
	$response = $value;
	echo $response;
	
	mysql_close();


?>