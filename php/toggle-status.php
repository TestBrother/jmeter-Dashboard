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

    $testId = mysql_real_escape_string($_GET["testid"]);

	# Work out the length of the test
	$query = sprintf("SELECT accepted FROM tests WHERE testid = '%d'",
	    $testId);
	$result = mysql_query($query);
	$row = mysql_fetch_assoc($result);
	$currentStatus=$row['accepted'];
	
	if($currentStatus=='N'){
		$newStatus='Y';
	} else {
		$newStatus='N';
	}
	
	$queryUpdate = sprintf("UPDATE tests 
							SET accepted = '%s'
							WHERE testid = %d",
							$newStatus,
							$testId);

	$resultUpdate = mysql_query($queryUpdate);	
	
	$response = '{"statusVal":"'.$newStatus.'"}';
	echo $response;

	mysql_close();


?>