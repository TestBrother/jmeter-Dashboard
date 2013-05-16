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

    $testId = mysql_real_escape_string($_POST["testid"]);


	$queryDeleteTests= sprintf("DELETE FROM tests 
							WHERE testid = %d",
							$testId);

	$result = mysql_query($queryDeleteTests);	
	
	$queryDeleteResults = sprintf("DELETE FROM results 
							WHERE testid = %d",
							$testId);

	$result = mysql_query($queryDeleteResults);
	
	$response = $testId;
	echo $response;
	
	mysql_close();


?>