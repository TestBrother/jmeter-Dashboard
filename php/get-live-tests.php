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

	$qstring = "SELECT testid, startdate, buildlife, project, environment, duration, comment, accepted 
				FROM tests WHERE 
				status = 1
				ORDER BY testid DESC 
				LIMIT 50;";
	
	//echo $qstring;
	
	$result = mysql_query($qstring);//query the database for running tests

	while ($row = mysql_fetch_array($result,MYSQL_ASSOC))//loop through the retrieved values
	{
			$row['value']=htmlentities(stripslashes($row['value']));
			$row['testid']=(int)$row['testid'];
			$row_set[] = $row;//build an array
	}
	echo json_encode($row_set);//format the array into json data

	mysql_close();
?>