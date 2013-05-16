<?php
#
# 
#
# 
#
	$selectedTestId = $_POST["testid"];
	$recordCount = $_POST["recordCount"];

	$dbUser = $_POST["dbuser"];
	$dbPass = $_POST["dbpass"];
	$dbHost = $_POST["dbhost"];
	$dbName = $_POST["dbname"];

	$conn = mysql_connect($dbHost,$dbUser,$dbPass) or trigger_error("SQL", E_USER_ERROR);
	$db = mysql_select_db($dbName,$conn) or trigger_error("SQL", E_USER_ERROR);

	# Remove memory limit
	ini_set('memory_limit', '-1');
	
	# Work out the length of the test
	$queryTimestampExtremes = sprintf("SELECT max(timestamp) as max_timestamp, min(timestamp) as min_timestamp FROM results WHERE testid = '%d'",
	    $selectedTestId);
	$resultExtremes = mysql_query($queryTimestampExtremes);
	$row = mysql_fetch_assoc($resultExtremes);
	$minTimestamp=$row['min_timestamp'];
	$maxTimestamp=$row['max_timestamp'];
	$testDuration=$maxTimestamp-$minTimestamp;

	
	# How many different hostnames do we have
	$queryHostnameData = sprintf("SELECT count(*) FROM results WHERE testid = '%d' GROUP BY hostname",
	    $selectedTestId);
	$resultHostnames = mysql_query($queryHostnameData);
	$row = mysql_fetch_assoc($resultHostnames);
	$count_hostnames = mysql_num_rows($resultHostnames);
	
	
	# How many different labels do we have
	$queryLabelData = sprintf("SELECT count(*) FROM results WHERE testid = '%d' GROUP BY label",
	    $selectedTestId);
	$result = mysql_query($queryLabelData);
	$row = mysql_fetch_assoc($result);
	$count_labels = mysql_num_rows($result);
	
		
	//Set granularity for desired total number of rows
	$granularity = $testDuration / $recordCount; // I want $recordCount rows
	
	// Adjust for labels
	$granularity = $granularity * $count_labels;
	
	// Adjust for hostnames
	$granularity = $granularity * $count_hostnames;
	
	
	$queryData = sprintf("SELECT
	 							testid,
								(SELECT ROUND(timestamp / %d)) as ts_aggregate,
								MAX(timestamp) as timestamp,
								ROUND(AVG(elapsed)) as elapsed,
								MIN(elapsed) as min_elapsed,
								MAX(elapsed) as max_elapsed,
								responsecode as responsecode,
								label as label,
				                SUM(CASE WHEN success = 'true' then 1 Else 0 end) AS success_count,
				                SUM(CASE WHEN success = 'false' then 1 Else 0 end) AS fail_count,
								ROUND(SUM(bytes)) as bytes,
								ROUND(AVG(grpthreads)) as grpthreads,
								ROUND(AVG(allthreads)) as allthreads,
								ROUND(AVG(latency)) as latency,
								hostname as hostname
								FROM results
								WHERE testid = '%s' 
								GROUP BY ts_aggregate, label, hostname, responsecode
								ORDER BY timestamp",
								$granularity,
	    						$selectedTestId);
	

	$resultData = mysql_query($queryData);
	
	
	$rows = array();
	while($r = mysql_fetch_assoc($resultData)) {
	    $rows[] = $r;
	}
	
	
	$response = '{"results":'.json_encode($rows).'}';
	echo $response;

	mysql_close();


?>