/*
 * ========================================================================================
 * jvisualiser.js | JVisualiser
 * ========================================================================================
 */

//Global Vars
var min_det=0, max_det=99999999999999, min_cp0, max_cp0, min_cp1, max_cp1;
var minElapsed_det=0, maxElapsed_det=99999999999999, minElapsed_cp0, maxElapsed_cp0, minElapsed_cp1, maxElapsed_cp1;
var paramLabel = '';
var paramHost='';
var paramCode='';
var objDataTable_det;
var hostString, transactionString;
var sDEMODB='oliverll_jv_demo'

var cDBNAME='mydatabasename', cDBUSER='root', cDBHOST='127.0.0.1', cDBPASS='mypassword'

//Global vars used to track the selected row or rows in the tests table - used later for the Analyse and Compare actions
var selectedTestid_det, selectedTestid_cp0, selectTestid_cp1;


function initialisePage() {

	// Add the sitebar plugin then hide it
	$("#toolbar").jixedbar();
	$("#toolbar").css("height", "0");
	// (we need the toolbar at the correct height when it is loaded so that the tooltips are well positioned, then we hide it)
	
	// Create overlay and append to body
    $('<div id="overlay"/>').css({
        position: 'fixed',
        top: 0,
        left: 0,
		opacity: 0.8,
        width: '100%',
        height: $(window).height() + 'px',
        background: '#000000 url(assets/images/grey-loader.gif) no-repeat center',
		'z-index': 100
    }).hide().appendTo('body');
	
	initialiseDatabase();
	initialiseWhereClauses();
	
	// Check if no values are stored for database connection
	if (!getConfig()){
		//$('#titleActivity_det').html('<h3>Please enter valid database connection details in the settings form.</h3>')
	}
	
	autocomplete();

	// Autocompletes
	$( "#autocomplete_det" ).autocomplete( "option", "minLength", 0 );
	$("#autocomplete_det").autocomplete('search', '');
	
	// Tooltips
	$("[rel=tooltip]").tooltip();
	
	$("[rel=popover_left]").popover({
		placement: 'left',
		title: 'JVisualiser'
	});

	$("[rel=popover_right]").popover({
		placement: 'right',
		title: 'JVisualiser'
	});
	
	$('#cpAccordion').on('show', function () {
		$('#cpAccordionLabelOne').text('Hide filter');
	})
	
	$('#cpAccordion').on('hide', function () {
		$('#cpAccordionLabelOne').text('Show filter');
	})
		
	// Add multiple select / deselect functionality on aggregate table
	$("#selectAll").click(function () {
		$('.chcktbl').attr('checked', this.checked);
		
		// Enable the filter button when at least one row is checked
		if($(".chcktbl:checked").length > 0) {
			$('#btnAggDrillDown').removeAttr("disabled");
		} else {
			$('#btnAggDrillDown').attr("disabled", "disabled");
		}
	});


	// Get any query params
	var pTestid=getURLParameter('testid');
	var pRecordCount=getURLParameter('recordCount');
	var pLabels=getURLParameter('labels');
	var pMin=getURLParameter('min');
	var pMax=getURLParameter('max');
	var pCode=getURLParameter('code');
	var pHost=getURLParameter('host');
	
	// Check for min and max range criteria in the query params
	if ((pMin != 'null')||(pMax != 'null')){
		zoomStatus(true);
		
		if (pMin != 'null') {
			// a min value was provided as a query string
			min_det=pMin;
		} else {
			// Reset
			min_det=0;
		}

		if (pMax != 'null') {
			max_det=pMax;
		} else {
			//Reset
			max_det=99999999999999;
		}
	}
	else {
		zoomStatus(false); // Not really required but it feels better this way
	}

	if (pLabels != 'null') {
		// The labels url param was sent
		var arrLabels=[];
		var jsonLabels=window.unescape(pLabels);
		objLabels=JSON.parse(jsonLabels)
		
		$.each(objLabels, function(i, label){
			arrLabels[i]=label;
		 });
		
		setWhereClause('Transaction', arrLabels, '_det');
	}
	
	if (pCode != 'null') {
		// The code url param was sent		
		setWhereClause('Code', pCode, '_det');
	}	

	if (pHost != 'null') {
		// The code url param was sent		
		setWhereClause('Host', pHost, '_det');
	}
	
	if (pRecordCount != 'null') {
		// Set the value of the recordCount input
		$('#inputRecordCount').val(pRecordCount);
	}
	
	if (pTestid != 'null') {
		// We have testid as a URL param so record the value in the DOM and launch the view
		$('#inputTestid_det').val(pTestid);
		launchDetailView(pTestid, 'url');
		// Show filter controls
		filterVisibility(true);
	} else {
		// Set focus to search field
		document.getElementById('autocomplete_det').focus()
		$('#overlay').hide();
	}
	
	// Render the live tests table and then set a polling interval
	//getLiveTests();
	//setInterval( "getLiveTests()", 5000 );
}

function initialiseDatabase(){ // Called from page load
	
	function pickRandomURL(){
		// Sillyness
		var num_urls = 6;
	    var rand_no=Math.floor(Math.random()*num_urls)
	    switch(rand_no) {
	        case 0: return "http://htwins.net/scale2/scale2.swf?bordercolor=white";
	                break;
	        case 1: return "http://hyperpolyglot.org/scripting";
	                break; 
	        case 2: return "http://97things.oreilly.com/wiki/index.php/Quantify";
	                break;
	        case 3: return "http://www.rubular.com/";
	                break;
	        case 4: return "http://www.html5rocks.com/en/";
	                break;
	        case 5: return "https://github.com/jkbr/httpie";
	                break;
	        default: return "http://htwins.net/scale2/scale2.swf?bordercolor=white";
	    }
	}
	try {  
		if (!window.openDatabase) {  
			bootbox.dialog("No, that won't work. WEB SQL Databases are not supported in this browser. Try Chrome.", [
			{
			    "label" : "Or something totally different.",
			    "class" : "btn-primary",
			    "callback": function() {
			        location.href = pickRandomURL();
			    }
			},{
			    "label" : "WEB what?",
				"class" : "btn-info",
			    "callback": function() {
			        location.href = 'http://en.wikipedia.org/wiki/Web_SQL_Database';
			    }
			},{
			    "label" : "Get Chrome.",
			    "callback": function() {
			        location.href = 'https://www.google.com/chrome';
			    }
			}
			]);
		} else {  

			// We need to have a check here to see if the db is already open
			var shortName = 'JMETERDB';  
			var version = '1.0';  
			var displayName = 'JMeter Database';  
			var maxSize = 10000000; //  bytes  
			JMETERDB = openDatabase(shortName, version, displayName, maxSize);  
			createResultsTable(); 
			//createTestsTable();
			//createErrorsTable();
		}  
	} catch(e) {  

		if (e == 2) {  
			// Version number mismatch.  
			console.log("Invalid database version.");  
		} else {  
			console.log("Unknown error "+e+".");  
		}  
		return;  
	}
}

function getConfig(){
	// Read any values from local stroage and populate the config form with them
	var config_dbname = localStorage.getItem("config_dbname");
	if(config_dbname){
		// A value exists so use it
		$('#inputDBName').val(config_dbname);
	}
	
	var config_dbpass = localStorage.getItem("config_dbpass");
	if(config_dbpass){
		// A value exists so use it
		$('#inputDBPass').val(config_dbpass);
	}
	
	var config_dbuser = localStorage.getItem("config_dbuser");
	if(config_dbuser){
		// A value exists so use it
		$('#inputDBUser').val(config_dbuser);
	}
	
	var config_dbhost = localStorage.getItem("config_dbhost");
	if(config_dbhost){
		// A value exists so use it
		$('#inputDBHost').val(config_dbhost);
	}
	
	JMETERDB.transaction( 
		function (transaction) { 
			transaction.executeSql("SELECT testid from results GROUP BY testid;", [], successCountclearCache);
		}
	);
	
	function successCountclearCache(transaction, results){
		var dataset=results.rows;
		$('#inputCacheCount').val(results.rows.length);
	}
	
	if(config_dbname && config_dbuser && config_dbhost){
		return true;
	} else {
		return false;
	}
}

function saveConfig(){
	// take the contents of the config form and write it to local storage
	
	var config_dbname=$('#inputDBName').val();
	localStorage.setItem("config_dbname", config_dbname);
	
	var config_dbpass=$('#inputDBPass').val();
	localStorage.setItem("config_dbpass", config_dbpass);
	
	var config_dbuser=$('#inputDBUser').val();
	localStorage.setItem("config_dbuser", config_dbuser);
	
	var config_dbhost=$('#inputDBHost').val();
	localStorage.setItem("config_dbhost", config_dbhost);
	
	// Dispplay the DEMO text when the demo db is being used
	if(config_dbname===sDEMODB){
		$('#demoText').show();		
	} else {
		$('#demoText').hide();
	}

	//bootbox.alert("Values saved to local storage in this browser.");
}

function filterVisibility(show){
	if (show){
		//show filter
		//$('#filterDiv').show();
		//$('#permalinkDiv').show();
		//$('#toolbar').show();
		$('#toolbar').animate({"height":"32px"},700);
	} else {
		// hide filter
		//$('#filterDiv').hide();
		//$('#permalinkDiv').hide();
		//$('#toolbar').hide();
		$('#toolbar').animate({"height":"0px"},300);
	}
}

function createPermalink() {
	
	// First we check if the input is already visible
	if($('#inputPermalink').css("opacity")>0){
		return false;
	}
	
	var URLparams=window.location.protocol+'//'+window.location.host+window.location.pathname;
	
	var testid=document.getElementById('inputTestid_det').value;
	
	//console.log('testid: '+testid);
	if(testid){
		URLparams+='?testid='+testid;
	} else {
		return false; //No testid set
	}
	
	if(document.getElementById('inputRecordCount').value){
		URLparams+='&recordCount='+document.getElementById('inputRecordCount').value;
	}
	
	if(paramLabel) {
		URLparams+='&labels='+window.escape(paramLabel);
	}
	//console.log('paramCode: '+paramCode+' paramHost: '+paramHost);
	if(paramCode) {
		URLparams+='&code='+paramCode;
	}
	
	if(paramHost) {
		URLparams+='&host='+paramHost;
	}	
	
	if(min_det) {
		URLparams+='&min='+min_det;
	}
	
	if(max_det) {
		URLparams+='&max='+max_det;
	}
	
	$('#inputPermalink').val(URLparams);
    $("#inputPermalink").animate(
            { 
				opacity: '0.8',
		      	width: '500',
			},
            "fast").animate(
			{ 
				opacity: '1',
			},
			2000);

	$("#inputPermalink").select();
	
	$("#inputPermalink").blur(function() {
		$("#inputPermalink").animate(
			{ 
				width: '0',
			},
			"400").animate(
			{
				opacity: '0',
			},
			"300");
	});
}

function autocomplete() {
	var sDbname=cDBNAME//localStorage.getItem("config_dbname");
	var sDbpass=cDBPASS//localStorage.getItem("config_dbpass");	
	var sDbuser=cDBUSER//localStorage.getItem("config_dbuser");
	var sDbhost=cDBHOST//localStorage.getItem("config_dbhost");
	
	$('#titleActivity_det').text('Pending...');

	$("#autocomplete_det").autocomplete({
		source: function( request, response ) {
			$.ajax({
		  		type: 'POST',
				url: "php/autocomplete.php",
				dataType: "json",
				processData: false,
				data: 'term='+request.term+'&dbname='+sDbname+'&dbpass='+sDbpass+'&dbuser='+sDbuser+'&dbhost='+sDbhost,
				success: function(data) {
					// We pass in type so the function knows which table to work on
					// (_det = Detail tab, _cp0 or _cp1 = Comparison tab)
					refreshAutocompleteTable('_det', data, request, response);
				},
				error: function(jqXHR, exception) {
					$('#titleActivity_det').html('<h3>Error connecting to database.</h3>');
					if (jqXHR.status === 0) {
						bootbox.alert('Not connected.\n Verify Network.'+'<br/><br/>'+exception);
					} else if (jqXHR.status == 404) {
						bootbox.alert('Requested page not found. [404]'+'<br/><br/>'+exception);
					} else if (jqXHR.status == 500) {
						bootbox.alert('Internal Server Error [500].'+'<br/><br/>'+exception);
					} else if (exception === 'parsererror') {
						// This is the most likely cenario and where we end up the first time the site is visited in a new browser
						if (!getConfig()){
							// No values have been specified in the Setting form so default to demo db
							// TODO - Review this approach
							$('#titleActivity_det').html('<h3>Pending...</h3>');
					
							var config_dbname=sDEMODB;
							localStorage.setItem("config_dbname", config_dbname);
	
							var config_dbpass='jvpassword';
							localStorage.setItem("config_dbpass", config_dbpass);
	
							var config_dbuser='oliverll_jvdemo';
							localStorage.setItem("config_dbuser", config_dbuser);
	
							var config_dbhost='72.29.66.3';
							localStorage.setItem("config_dbhost", config_dbhost);
							
							// Reload the table using the values above
							autocomplete();
							$("#autocomplete_det").autocomplete('search', '');
							
							// Show the demo text
							$('#demoText').show();
						} else {
							bootbox.alert('Invalid response from database using connection details provided.', function() {
						   	containerVisibility('hide','hide','show','hide');
							});
						}
							
						
						
					} else if (exception === 'timeout') {
						bootbox.alert('Time out error.'+'<br/><br/>'+exception);
					} else if (exception === 'abort') {
						bootbox.alert('Ajax request aborted.'+'<br/><br/>'+exception);
					} else {
						bootbox.alert('Uncaught Error.\n' +'<br/><br/>'+ jqXHR.responseText);
					}
					
				}
			});
		}
	});
}

function disableAutocompleteEnterKey(e)
{
	var key;     
	if(window.event)
		key = window.event.keyCode; //IE
	else
		key = e.which; //firefox

	if (key==13)
		return false;
	else
		return true;
}

function refreshAutocompleteTable(type, data, request, response){
	var iDisplayLength=10;		
	
	// If data is null then no results were found for the search
	if (data == null) {
		// No results found sooo, show a warning
		// warning
		$('#labelNoResults'+type).removeAttr('style');
		$('#labelNoResults'+type).text('No results found for "'+request.term+'"');
		$('#searchBadge'+type).removeAttr('style');
		$('#searchBadge'+type).attr('class','badge badge-warning');
		$('#searchBadge'+type).text('0');
		$('#searchControlGroup'+type).attr('class','control-group warning');
		//$('#searchMsgText'+type).text('No results found');

		//refreshDataTable(type,'') // This leaves things a bit messy...could force a blank row or maybe hide the div...?
		
		$('#searchContainer'+type).css('visibility','hidden');
		
		// Clear the results table
		$('#theadTests'+type).html('');
		$('#tbodyTests'+type).html('');
		$('#titleActivity'+type).text('');
		
		return false; // Exit function to prevent jquery errors
	} else if (request.term == '') {
		// If term = '' then no search term was entered, obviously...
		//console.log('term=null');
		//remove formatting	
		$('#labelNoResults'+type).css('visibility','hidden');
		$('#labelNoResults'+type).text('');
		$('#searchControlGroup'+type).attr('class','control-group');
		$('#searchContainer'+type).removeAttr('style');
		//$('#searchBadge'+type).attr('class','badge badge-warning');
		$('#searchBadge'+type).css('visibility','hidden');
		$('#searchBadge'+type).text('');
		$('#titleActivity'+type).text('Recent Activity');
	} else {
		// Otherwise, we got n results and can write home about it
		//success

		// Set title
		$('#titleActivity'+type).text('Search Results');

		var resultText;
		var count = Object.keys(data).length;

		$('#labelNoResults'+type).text('');
		$('#labelNoResults'+type).css('visibility','hidden');
		$('#searchContainer'+type).removeAttr('style');
		$('#searchBadge'+type).attr('class','badge badge-success');
		$('#searchBadge'+type).removeAttr('style');
		$('#searchBadge'+type).text(count);
		$('#searchControlGroup'+type).attr('class','control-group success');
	}

	// Now we display the results
	var i=1;
	var tbodyHtml='';
	var theadHtml='';
	//var t, d, h, m, s;
	//var hours, minutes, seconds;

	theadHtml+='<tr>'
	//theadHtml+='<th>#</th>';
	theadHtml+='<th>ID</th>';
	theadHtml+='<th>Cached?</th>';
	theadHtml+='<th>Date</th>';
	theadHtml+='<th>Duration</th>';
	theadHtml+='<th>Version</th>';
	theadHtml+='<th>Project</th>';
	theadHtml+='<th>Environment</th>';
	theadHtml+='<th>Comment</th>';
	theadHtml+='<th>Baseline?</th>';
	theadHtml+='</tr>';
	$('#theadTests'+type).html(theadHtml);

	response($.map(data, function(item) {
		var startDate=new Date(parseInt(item.startdate));
		
		// --------------------------------------------------------------------------------------------------------
		// Duration - Once duration is present then use one of the methods below to parse seconds to formatted output
		console.log('item.duration:'+item.duration)
		t = parseInt(item.duration);
		console.log('t:'+t)
		t = t/1000; // Remove milliseconds
		d = Math.floor(t / (3600*24));
		t %= 3600*24;
		h = Math.floor(t / 3600);
		t %= 3600;
		m = Math.floor(t / 60);
		s = Math.floor(t % 60);
		
		durationText = 
			(d > 0 ? d + ' day' + ((d > 1) ? 's ' : ' ') : '') +
			(h > 0 ? h + ' hour' + ((h > 1) ? 's ' : ' ') : '') +
			(m > 0 ? m + ' minute' + ((m > 1) ? 's ' : ' ') : '') +
			(s > 0 ? s + ' second' + ((s > 1) ? 's' : '') : '');
		
		if(durationText === '') {durationText='No data'};
		
		console.log('durationText: '+durationText);
		/*
		OR
		
		t = parseInt(item.duration);
		// Days?
		hours=t.getHours();
		minutes=t.getMinutes();
		seconds=t.getSeconds();

		durationText = hours+'h:'+minutes+'m:'+seconds+'s';
		*/
		// --------------------------------------------------------------------------------------------------------		
		
		tbodyHtml+="<tr>";
		//tbodyHtml+='<td>'+i+'</td>';
		tbodyHtml+='<td>'+item.testid+'</td>';
		tbodyHtml+='<td></td>';
		tbodyHtml+='<td>'+startDate.toUTCString()+'</td>';
		tbodyHtml+='<td>'+durationText+'</td>';
		tbodyHtml+='<td>'+item.buildlife+'</td>';
		tbodyHtml+='<td>'+item.project+'</td>';
		tbodyHtml+='<td>'+item.environment+'</td>';
		tbodyHtml+='<td>'+item.comment+'</td>';
		tbodyHtml+='<td>'+item.accepted+'</td>';
		tbodyHtml+='</tr>';
		i++;
	}));
	
	// Refresh the datatable object
	if (typeof objDataTable_det != "undefined") {
		// The table has already been initialised but we want to refresh it (after changing the DOM)
		
		// This clears the datatable object and the html from the table
		objDataTable_det.fnClearTable();
		
		$('#selectedFirst').text('Select a row above.');
		$('#selectedSecond').text('-');
		
		// Reset the DOM
		$('#tbodyTests'+type).html(tbodyHtml);
		
		// bDestroy is the key here
		$('#searchResults'+type).dataTable({
			"sDom": '<"top">t<"bottom"ip><"clear">;',
			"iDisplayLength": iDisplayLength,
		    "aaSorting": [],
			"bDestroy": true,
			// Set the text colour to blue where the benchmark flag is set to true
			"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
				// Bold the grade for all 'A' grade browsers
				if ( aData[8] == "Y" )
				{
					$(nRow).css("color","#4169E1");
				}
			}
		});
		
		//Remove any random style that gets set on the table (weird width= stuff)
		$('#searchResults'+type).removeAttr('style');
		objDataTable_det.fnAdjustColumnSizing();
		
	} else {
		// First time so initialise
		
		// Set the DOM
		$('#tbodyTests'+type).html(tbodyHtml);
		
		// Datatable [http://datatables.net/index]	
		objDataTable_det=$('#searchResults'+type).dataTable({
			"sDom": '<"top">t<"bottom"ip><"clear">;', 
			"iDisplayLength": iDisplayLength, 
		    "aaSorting": [],
			// Set the text colour to blue where the benchmark flag is set to true
			"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
			      // Bold the grade for all 'A' grade browsers
			      if ( aData[8] == "Y" )
			      {
			        $(nRow).css("color","#4169E1");
			      }
			    }
		});	
		
		// Click handler
		$('#tbodyTests'+type+' tr').live('click', function(event){
			if(event.ctrlKey || event.metaKey){ 
				// Shift was used so we need to handle multiple row selection
				objSelected=fnGetSelected(objDataTable_det);
				if ( $(this).hasClass('row_selected') ){
					// Here the user is clicking on an already selected row, using the shift key
					// We want to unselect the row and update the labels
					$(this).removeClass('row_selected');
					$(this).removeClass('first_row');								
					
					// Update labels
					switch (objSelected.length){
						case 0:{
							// This will never happen as the row is alredy selected
						}
						break;
						case 1:{
							// We only had one row so just remove the first label
							$('#selectedFirst').text('Select a row above.');
							//$('#inputTestid_det').val('');
							$('#selectedSecond').text('-');
							//$('#inputTestid_cp0').val('');
							//$('#inputTestid_cp1').val('');							
							// Disable all buttons
							btnState(false, false);
						}
						break;
						case 2:{
							$('#selectedSecond').text('	 to select multiple rows.');
							// There WERE two rows, we want the other row to be used for the first label
							// so now that we have cleared on we van call fnGetSelected again to get the remaining row
							objSelected=fnGetSelected(objDataTable_det);
							$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(4).html()
													+'</span>  Project: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(5).html()
													+'</span>  Env: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(6).html()
													+'</span>  Test ID: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(0).html()+'</span>');
							selectedTestid_det=$(objSelected[0]).find("td").eq(0).html();						
							selectedTestid_cp0=$(objSelected[0]).find("td").eq(0).html();
							// Enable main buttons
							btnState(true, false);
							// Check baseline status and set button
							if ($(objSelected[0]).find("td").eq(8).html()=='N'){
								toggleBaselineButton(true)
							} else {
								toggleBaselineButton(false)
							}
							
						}
						break;
					}
				} else {
					switch (objSelected.length){
						case 0:{
							// Mark as first - using classes to mark a row...good/bad?
							$(this).addClass('first_row');
							$(this).addClass('row_selected'); //this
							$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
													+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
													+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
													+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
							selectedTestid_det=$(this).find("td").eq(0).html();						
							selectedTestid_cp0=$(this).find("td").eq(0).html();
							// Enable main buttons
							btnState(true, false);
							// Check baseline status and set button
							if ($(this).find("td").eq(8).html()=='N'){
								toggleBaselineButton(true)
							} else {
								toggleBaselineButton(false)
							}
						}
						break;
						case 1:{
							// Second row selected
							$(this).addClass('row_selected');
							$('#selectedSecond').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
													+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
													+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
													+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
							selectedTestid_cp1=$(this).find("td").eq(0).html();
							// Enable all buttons
							btnState(true, true);
							// Check baseline status and set button
							if ($(this).find("td").eq(8).html()=='N'){
								toggleBaselineButton(true)
							} else {
								toggleBaselineButton(false)
							}
						}
						break;
						case 2 :{
							// Third row selected so we need to deselect the oldest selection
							// check both rows, if class = first_row, then remove
							if ( $(objSelected[0]).hasClass('first_row') ){
								$(objSelected[0]).removeClass('row_selected');
								// Re-assign the first row
								$(objSelected[0]).removeClass('first_row');
								$(objSelected[1]).addClass('first_row');
								// Refresh labels
								$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(0).html()+'</span>');
								selectedTestid_det=$(objSelected[1]).find("td").eq(0).html();						
								selectedTestid_cp0=$(objSelected[1]).find("td").eq(0).html();
								$('#selectedSecond').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
								selectedTestid_cp1=$(this).find("td").eq(0).html();
								// Check baseline status and set button
								if ($(objSelected[1]).find("td").eq(8).html()=='N'){
									toggleBaselineButton(true)
								} else {
									toggleBaselineButton(false)
								}
							} else {
								$(objSelected[1]).removeClass('row_selected');
								// Re-assign the first row
								$(objSelected[1]).removeClass('first_row');
								$(objSelected[0]).addClass('first_row');
								// Refresh labels
								$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(0).html()+'</span>');
								selectedTestid_det=$(objSelected[0]).find("td").eq(0).html();						
								selectedTestid_cp0=$(objSelected[0]).find("td").eq(0).html();
								$('#selectedSecond').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
								selectedTestid_cp1=$(this).find("td").eq(0).html();
								// Check baseline status and set button
								if ($(objSelected[0]).find("td").eq(8).html()=='N'){
									toggleBaselineButton(true)
								} else {
									toggleBaselineButton(false)
								}
							}
						
							// Enable all buttons
							btnState(true, true);
						
							// Mark new row as selected
							$(this).addClass('row_selected');
						}
					}
				}
			} else { 	
				// No shift key used so it's simply a matter of clearing all highlighting from the table and
			 	// then selecting the clicked row.
				if ( $(this).hasClass('row_selected') && fnGetSelected(objDataTable_det).length<2){
					//This row is already selected and no other rows are selected so deselect this row and disable all buttons
					$(this).removeClass('row_selected');
					$('#selectedFirst').text('Select a row above.');
					//$('#inputTestid_det').val('');
					$('#selectedSecond').text('-');
					//$('#inputTestid_cp1').val('');
					//$('#inputTestid_cp0').val('');
					// Disble all buttons
					btnState(false, false);
				} else {
					$(objDataTable_det.fnSettings().aoData).each(function (){
						$(this.nTr).removeClass('row_selected');
						$(this.nTr).removeClass('first_row');
					});
					$(event.target.parentNode).addClass('row_selected');
					$(event.target.parentNode).addClass('first_row');
					// Set the labels	
					$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
											+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
											+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
											+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
					selectedTestid_det=$(this).find("td").eq(0).html();						
					selectedTestid_cp0=$(this).find("td").eq(0).html();
					$('#selectedSecond').text('Use shift to select multiple rows.');
					selectedTestid_cp1='';
					
					// Enable main buttons, disable compare
					btnState(true, false);
					// Check baseline status and set button
					if ($(this).find("td").eq(8).html()=='N'){
						toggleBaselineButton(true)
					} else {
						toggleBaselineButton(false)
					}
				}
			}
		});
		
		function fnGetSelected( oTable )
		{
			var aReturn = new Array();
			var aTrs = oTable.fnGetNodes();

			for ( var i=0 ; i<aTrs.length ; i++ )
			{
				if ( $(aTrs[i]).hasClass('row_selected') )
				{
					aReturn.push( aTrs[i] );
				}
			}
			return aReturn;
		}
		
		function btnState(enableSingle, enableMultiple){
			if(enableSingle){
				// Enable analyse buttons
				$('.btn-state').attr("disabled", false);
				
				// Enable clear cache (selected) button if test present in cache
				$.each(objDataTable_det.fnGetNodes(), function(index, value) {
					if($(value).find("td").eq(0).text()===selectedTestid_det){
						if($(value).find("td").eq(1).text()==='Y'){
							// Only enable the clear select cache button is the selected test is in fact in the cache
							$('#btnClearCache_selected').attr("disabled", false);
						} else {
							$('#btnClearCache_selected').attr("disabled", true);
						}
					}
				});
			} else {
				// Disable analyse buttons
				$('.btn-state').attr("disabled", true);
				// Disable clear selected cache button
				$('#btnClearCache_selected').attr("disabled", true);
			}
			
			if(enableMultiple){
				// Enable compare button
				$('#btnCompare_det').attr("disabled", false);
				
				// Show second row
				$('#divSecondRow').slideDown();
			} else {
				// Disable compare button
				$('#btnCompare_det').attr("disabled", true);
				
				// Hide second row
				$('#divSecondRow').slideUp();
			}
		}		
	}
	
	var sDbname=cDBNAME//localStorage.getItem("config_dbname");
	var sDbpass=cDBPASS//localStorage.getItem("config_dbpass");	
	var sDbuser=cDBUSER//localStorage.getItem("config_dbuser");
	var sDbhost=cDBHOST//localStorage.getItem("config_dbhost");
	
	// Use JEditable plugin to make table editable (via update-test.php)
	// JEditable [http://www.appelsiini.net/projects/jeditable]
	$('td:eq(7)', objDataTable_det.fnGetNodes()).editable( 'php/update-test.php', {
			
		indicator : '<img src="assets/images/ajax-loader.gif">',
		tooltip   : 'Click to edit...',
		
		"callback": function( sValue, y ) {
			var aPos = objDataTable_det.fnGetPosition( this );
			objDataTable_det.fnUpdate( sValue, aPos[0], aPos[1], false);
		},
		"submitdata": function ( value, settings ) {
			var aPos = objDataTable_det.fnGetPosition( this );
			return {
				"test_id": objDataTable_det.fnGetData( aPos[0], 0 ),
				"column": objDataTable_det.fnGetPosition( this )[1],
				"dbname": sDbname,
				"dbpass": sDbpass,
				"dbuser": sDbuser,
				"dbhost": sDbhost
			};
		},
		"height": "14px"
	});
	
	// Now the table is refreshed and redrawn we call checkLocalCache to loop through the server records and 
	// mark tests that are stored locally
	checkLocalCache();

}

function getLiveTests() {
		
	var sDbname=cDBNAME//localStorage.getItem("config_dbname");
	var sDbpass=cDBPASS//localStorage.getItem("config_dbpass");	
	var sDbuser=cDBUSER//localStorage.getItem("config_dbuser");
	var sDbhost=cDBHOST//localStorage.getItem("config_dbhost");
	
	var postParams = 'dbname='+sDbname+'&dbpass='+sDbpass+'&dbuser='+sDbuser+'&dbhost='+sDbhost;
	
	var postURL = 'php/get-live-tests.php';


	$.ajax({
  		type: 'POST',
		url: postURL,
		dataType: "json",
		processData: false,
		data: postParams,
		success: function(data) {
			refreshLiveTestsTable(data);
		},
		error: function(jqXHR, exception) {
			$('#titleActivity_live').html('<h3>Error connecting to database.</h3>');
			if (jqXHR.status === 0) {
				bootbox.alert('Not connected.\n Verify Network.'+'<br/><br/>'+exception);
			} else if (jqXHR.status == 404) {
				bootbox.alert('Requested page not found. [404]'+'<br/><br/>'+exception);
			} else if (jqXHR.status == 500) {
				bootbox.alert('Internal Server Error [500].'+'<br/><br/>'+exception);
			} else if (exception === 'parsererror') {
				bootbox.alert('Parse Error.'+'<br/><br/>'+exception);					
			} else if (exception === 'timeout') {
				bootbox.alert('Time out error.'+'<br/><br/>'+exception);
			} else if (exception === 'abort') {
				bootbox.alert('Ajax request aborted.'+'<br/><br/>'+exception);
			} else {
				bootbox.alert('Uncaught Error.\n' +'<br/><br/>'+ jqXHR.responseText);
			}
		}
	});

}

function refreshLiveTestsTable(data){
	var iDisplayLength=10;		
	// If data is null then no results were found for the search
	if (data == null) {
		// No results found sooo
		$('#titleActivity_live').text('There are no tests currently running');
		
		// This clears the datatable object and the html from the table
		//objDataTable_live.fnClearTable();
		
		// Reset the DOM
		var tbodyHtml='';
		
		//return false; // Exit function to prevent jquery errors

	} else {

		// Otherwise, we got n results and can write home about it
		//success

		// Set title
		$('#titleActivity_live').text('The following tests are running at the moment:');

		var resultText;
		var count = Object.keys(data).length;
		
		var tbodyHtml='';
		
		$.map(data, function(item) {
			var startDate=new Date(parseInt(item.startdate));

			tbodyHtml+="<tr>";
			//tbodyHtml+='<td>'+i+'</td>';
			tbodyHtml+='<td>'+item.testid+'</td>';
			//tbodyHtml+='<td></td>';
			tbodyHtml+='<td>'+startDate.toUTCString()+'</td>';
			//tbodyHtml+='<td>'+durationText+'</td>';
			tbodyHtml+='<td>'+item.buildlife+'</td>';
			tbodyHtml+='<td>'+item.project+'</td>';
			tbodyHtml+='<td>'+item.environment+'</td>';
			tbodyHtml+='<td>'+item.comment+'</td>';
			//tbodyHtml+='<td>'+item.accepted+'</td>';
			tbodyHtml+='</tr>';
			i++;
		});

	}

	// Now we display the results
	var i=1;
	var theadHtml='';

	theadHtml+='<tr>'
	theadHtml+='<th>ID</th>';
	//theadHtml+='<th>Cached?</th>';
	theadHtml+='<th>Date</th>';
	//theadHtml+='<th>Duration</th>';
	theadHtml+='<th>Version</th>';
	theadHtml+='<th>Project</th>';
	theadHtml+='<th>Environment</th>';
	theadHtml+='<th>Comment</th>';
	//theadHtml+='<th>Baseline?</th>';
	theadHtml+='</tr>';
	$('#theadTests_live').html(theadHtml);


	
	// Refresh the datatable object
	if (typeof objDataTable_live != "undefined") {
		// The table has already been initialised but we want to refresh it (after changing the DOM)
		
		// This clears the datatable object and the html from the table
		objDataTable_live.fnClearTable();
		
		// Reset the DOM
		$('#tbodyTests_live').html(tbodyHtml);
		
		// bDestroy is the key here
		$('#searchResults_live').dataTable({
			"sDom": '<"top">t<"bottom"ip><"clear">;',
			"iDisplayLength": iDisplayLength,
		    "aaSorting": [],
			"bDestroy": true,
			// Set the text colour to blue where the benchmark flag is set to true
			//"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
				// Bold the grade for all 'A' grade browsers
			//	if ( aData[8] == "Y" )
			//	{
			//		$(nRow).css("color","#4169E1");
			//	}
			//}
		});
		
		//Remove any random style that gets set on the table (weird width= stuff)
		//$('#searchResults_live').removeAttr('style');
		//objDataTable_live.fnAdjustColumnSizing();
		
	} else {
		// First time so initialise
		
		// Set the DOM
		$('#tbodyTests_live').html(tbodyHtml);
		
		// Datatable [http://datatables.net/index]	
		objDataTable_live=$('#searchResults_live').dataTable({
			"sDom": '<"top">t<"bottom"ip><"clear">;', 
			"iDisplayLength": iDisplayLength, 
		    "aaSorting": [],
			// Set the text colour to blue where the benchmark flag is set to true
			//"fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
			      // Bold the grade for all 'A' grade browsers
			//      if ( aData[8] == "Y" )
			//      {
			//        $(nRow).css("color","#4169E1");
			//      }
			//    }
		});	
/*		
		// Click handler
		$('#tbodyTests'+type+' tr').live('click', function(event){
			if(event.ctrlKey || event.metaKey){ 
				// Shift was used so we need to handle multiple row selection
				objSelected=fnGetSelected(objDataTable_det);
				if ( $(this).hasClass('row_selected') ){
					// Here the user is clicking on an already selected row, using the shift key
					// We want to unselect the row and update the labels
					$(this).removeClass('row_selected');
					$(this).removeClass('first_row');								
					
					// Update labels
					switch (objSelected.length){
						case 0:{
							// This will never happen as the row is alredy selected
						}
						break;
						case 1:{
							// We only had one row so just remove the first label
							$('#selectedFirst').text('Select a row above.');
							//$('#inputTestid_det').val('');
							$('#selectedSecond').text('-');
							//$('#inputTestid_cp0').val('');
							//$('#inputTestid_cp1').val('');							
							// Disable all buttons
							btnState(false, false);
						}
						break;
						case 2:{
							$('#selectedSecond').text('	 to select multiple rows.');
							// There WERE two rows, we want the other row to be used for the first label
							// so now that we have cleared on we van call fnGetSelected again to get the remaining row
							objSelected=fnGetSelected(objDataTable_det);
							$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(4).html()
													+'</span>  Project: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(5).html()
													+'</span>  Env: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(6).html()
													+'</span>  Test ID: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(0).html()+'</span>');
							selectedTestid_det=$(objSelected[0]).find("td").eq(0).html();						
							selectedTestid_cp0=$(objSelected[0]).find("td").eq(0).html();
							// Enable main buttons
							btnState(true, false);
							// Check baseline status and set button
							if ($(objSelected[0]).find("td").eq(8).html()=='N'){
								toggleBaselineButton(true)
							} else {
								toggleBaselineButton(false)
							}
							
						}
						break;
					}
				} else {
					switch (objSelected.length){
						case 0:{
							// Mark as first - using classes to mark a row...good/bad?
							$(this).addClass('first_row');
							$(this).addClass('row_selected'); //this
							$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
													+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
													+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
													+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
							selectedTestid_det=$(this).find("td").eq(0).html();						
							selectedTestid_cp0=$(this).find("td").eq(0).html();
							// Enable main buttons
							btnState(true, false);
							// Check baseline status and set button
							if ($(this).find("td").eq(8).html()=='N'){
								toggleBaselineButton(true)
							} else {
								toggleBaselineButton(false)
							}
						}
						break;
						case 1:{
							// Second row selected
							$(this).addClass('row_selected');
							$('#selectedSecond').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
													+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
													+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
													+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
							selectedTestid_cp1=$(this).find("td").eq(0).html();
							// Enable all buttons
							btnState(true, true);
							// Check baseline status and set button
							if ($(this).find("td").eq(8).html()=='N'){
								toggleBaselineButton(true)
							} else {
								toggleBaselineButton(false)
							}
						}
						break;
						case 2 :{
							// Third row selected so we need to deselect the oldest selection
							// check both rows, if class = first_row, then remove
							if ( $(objSelected[0]).hasClass('first_row') ){
								$(objSelected[0]).removeClass('row_selected');
								// Re-assign the first row
								$(objSelected[0]).removeClass('first_row');
								$(objSelected[1]).addClass('first_row');
								// Refresh labels
								$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(objSelected[1]).find("td").eq(0).html()+'</span>');
								selectedTestid_det=$(objSelected[1]).find("td").eq(0).html();						
								selectedTestid_cp0=$(objSelected[1]).find("td").eq(0).html();
								$('#selectedSecond').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
								selectedTestid_cp1=$(this).find("td").eq(0).html();
								// Check baseline status and set button
								if ($(objSelected[1]).find("td").eq(8).html()=='N'){
									toggleBaselineButton(true)
								} else {
									toggleBaselineButton(false)
								}
							} else {
								$(objSelected[1]).removeClass('row_selected');
								// Re-assign the first row
								$(objSelected[1]).removeClass('first_row');
								$(objSelected[0]).addClass('first_row');
								// Refresh labels
								$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(objSelected[0]).find("td").eq(0).html()+'</span>');
								selectedTestid_det=$(objSelected[0]).find("td").eq(0).html();						
								selectedTestid_cp0=$(objSelected[0]).find("td").eq(0).html();
								$('#selectedSecond').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
														+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
														+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
														+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
								selectedTestid_cp1=$(this).find("td").eq(0).html();
								// Check baseline status and set button
								if ($(objSelected[0]).find("td").eq(8).html()=='N'){
									toggleBaselineButton(true)
								} else {
									toggleBaselineButton(false)
								}
							}
						
							// Enable all buttons
							btnState(true, true);
						
							// Mark new row as selected
							$(this).addClass('row_selected');
						}
					}
				}
			} else { 	
				// No shift key used so it's simply a matter of clearing all highlighting from the table and
			 	// then selecting the clicked row.
				if ( $(this).hasClass('row_selected') && fnGetSelected(objDataTable_det).length<2){
					//This row is already selected and no other rows are selected so deselect this row and disable all buttons
					$(this).removeClass('row_selected');
					$('#selectedFirst').text('Select a row above.');
					//$('#inputTestid_det').val('');
					$('#selectedSecond').text('-');
					//$('#inputTestid_cp1').val('');
					//$('#inputTestid_cp0').val('');
					// Disble all buttons
					btnState(false, false);
				} else {
					$(objDataTable_det.fnSettings().aoData).each(function (){
						$(this.nTr).removeClass('row_selected');
						$(this.nTr).removeClass('first_row');
					});
					$(event.target.parentNode).addClass('row_selected');
					$(event.target.parentNode).addClass('first_row');
					// Set the labels	
					$('#selectedFirst').html('Version: <span class="badge badge-info">'+$(this).find("td").eq(4).html()
											+'</span>  Project: <span class="badge badge-info">'+$(this).find("td").eq(5).html()
											+'</span>  Env: <span class="badge badge-info">'+$(this).find("td").eq(6).html()
											+'</span>  Test ID: <span class="badge badge-info">'+$(this).find("td").eq(0).html()+'</span>');
					selectedTestid_det=$(this).find("td").eq(0).html();						
					selectedTestid_cp0=$(this).find("td").eq(0).html();
					$('#selectedSecond').text('Use shift to select multiple rows.');
					selectedTestid_cp1='';
					
					// Enable main buttons, disable compare
					btnState(true, false);
					// Check baseline status and set button
					if ($(this).find("td").eq(8).html()=='N'){
						toggleBaselineButton(true)
					} else {
						toggleBaselineButton(false)
					}
				}
			}
		});
		
		function fnGetSelected( oTable )
		{
			var aReturn = new Array();
			var aTrs = oTable.fnGetNodes();

			for ( var i=0 ; i<aTrs.length ; i++ )
			{
				if ( $(aTrs[i]).hasClass('row_selected') )
				{
					aReturn.push( aTrs[i] );
				}
			}
			return aReturn;
		}
		
		function btnState(enableSingle, enableMultiple){
			if(enableSingle){
				// Enable analyse buttons
				$('.btn-state').attr("disabled", false);
				
				// Enable clear cache (selected) button if test present in cache
				$.each(objDataTable_det.fnGetNodes(), function(index, value) {
					if($(value).find("td").eq(0).text()===selectedTestid_det){
						if($(value).find("td").eq(1).text()==='Y'){
							// Only enable the clear select cache button is the selected test is in fact in the cache
							$('#btnClearCache_selected').attr("disabled", false);
						} else {
							$('#btnClearCache_selected').attr("disabled", true);
						}
					}
				});
			} else {
				// Disable analyse buttons
				$('.btn-state').attr("disabled", true);
				// Disable clear selected cache button
				$('#btnClearCache_selected').attr("disabled", true);
			}
			
			if(enableMultiple){
				// Enable compare button
				$('#btnCompare_det').attr("disabled", false);
				
				// Show second row
				$('#divSecondRow').slideDown();
			} else {
				// Disable compare button
				$('#btnCompare_det').attr("disabled", true);
				
				// Hide second row
				$('#divSecondRow').slideUp();
			}
		}
*/		
	}
}

function clickDelete(){
	//Make sure that the hidden value for the testid is equal to the value selected in the table (Global vars)
	$('#inputTestid_det').val(selectedTestid_det);
	deleteTest(document.getElementById('inputTestid_det').value);
}

function clickClearCache(){
	//Make sure that the hidden value for the testid is equal to the value selected in the table (Global vars)
	$('#inputTestid_det').val(selectedTestid_det);
	clearCache(document.getElementById('inputTestid_det').value);
}

function clickBaseline(){
	//Make sure that the hidden value for the testid is equal to the value selected in the table (Global vars)
	$('#inputTestid_det').val(selectedTestid_det);
	getBenchmarkStatus(document.getElementById('inputTestid_det').value);
}

function clickAnalyse(){
	//Make sure that the hidden value for the testid is equal to the value selected in the table (Global vars)
	$('#inputTestid_det').val(selectedTestid_det);
	launchDetailView(document.getElementById('inputTestid_det').value, 'table');
}

function clickCompare() {
	//Make sure that the hidden values for the testids are equal to the values selected in the table (Global vars)
	$('#inputTestid_cp0').val(selectedTestid_cp0);
	$('#inputTestid_cp1').val(selectedTestid_cp1);
	
	prepareComparisonView(document.getElementById('inputTestid_cp0').value, document.getElementById('inputTestid_cp1').value);
}

function checkLocalCache() {

	var query =' SELECT '
	+' testid'
	+' FROM results'
	+' GROUP BY testid'
	+';';						

	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(query, [],  
				checkLocalCacheSuccess, checkLocalCacheError);  
		}  
	);

	function checkLocalCacheSuccess(transaction, results) {
		
		var localTestIds=[];
		
		if (results.rows.length>0) {
			var dataset=results.rows;
			var item = dataset.item(0);
			
			// Set an array of all testids stored in the local, browser based, sql web database
			for (var i=0; i<results.rows.length; i++) {
				item = dataset.item(i);
				localTestIds.push(item['testid']);
			}
		}	
		
		// Now we loop through each row checking if the test is in the local cache or not and setting a flag
		$.each(objDataTable_det.fnGetNodes(), function(index, value) {
		     if(localTestIds.indexOf(parseInt($(value).find("td").eq(0).text())) > -1){
				// cached
				$(value).find("td").eq(1).text('Y');
			} else {
				// not cached
				$(value).find("td").eq(1).text('N');
			}
		});
		
		$('#btnRefresh_det').button('reset')

	}

	function checkLocalCacheError(){
		return false
	}
}

function containerVisibility(search,analysis,config,comparison){
	// Handler for showing and hiding the various containers on the index page.
	switch(search){
		case 'show':{
			$('#containerSearch').show("fast")
			filterVisibility(false);
		};break;
		case 'hide':{$('#containerSearch').hide("fast")};break;
		case 'up':{$('#containerSearch').slideUp("fast")};break;
		case 'down':{
			$('#containerSearch').slideDown("fast")
			filterVisibility(false);
		};break;
	}
	
	switch(analysis){
		case 'show':{
			$('#containerAnalysis').show("fast");
			filterVisibility(true);
			$('#toolbarText').text(toolbarText_det);
		};break;
		case 'hide':{
			$('#containerAnalysis').hide("fast");
		};break;
		case 'up':{
			$('#containerAnalysis').slideUp("fast");
		};break;
		case 'down':{
			$('#containerAnalysis').slideDown("fast");
			filterVisibility(true);
			$('#toolbarText').text(toolbarText_det);
		};break;
	}
	
	switch(config){
		case 'show':{
			$('#containerConfig').show("fast");
			filterVisibility(false);
			getConfig();
		};break;
		case 'hide':{
			$('#containerConfig').hide("fast")
		};break;
		case 'up':{
			$('#containerConfig').slideUp("fast")
		};break;
		case 'down':{
			$('#containerConfig').slideDown("fast")
			filterVisibility(false);
			getConfig();
		};break;
	}
	
	switch(comparison){
		case 'show':{
			$('#containerComparison').show("fast");
			filterVisibility(true);
			$('#toolbarText').text(toolbarText_cp);
		};break;
		case 'hide':{
			$('#containerComparison').hide("fast");
		};break;
		case 'up':{
			$('#containerComparison').slideUp("fast");
		};break;
		case 'down':{
			$('#containerComparison').slideDown("fast");
			filterVisibility(true);
			$('#toolbarText').text(toolbarText_cp);
		};break;
	}
}

function showAlert(message, type){
	switch(type){
		case 'warning':{
			$("#alertDiv strong").text('Warning. ');
			$("#alertDiv").attr('class','alert hide fade in');
		}
		break;
		case 'error':{
			$("#alertDiv strong").text('Error. ');
			$("#alertDiv").attr('class','alert hide alert-error fade in');			
		}
		break;
		case 'info':{
			$("#alertDiv strong").text('Info. ');
			$("#alertDiv").attr('class','alert alert-info hide fade in');			
		}
		break
		default :{
			$("#alertDiv strong").text('Warning. ');
			$("#alertDiv").attr('class','alert hide fade in');		
		}
	}	
	$("#alertDiv span").text(message);
	$("#alertDiv").animate({ 'height':'toggle','opacity':'toggle'});
    window.setTimeout( function(){
        $("#alertDiv").slideUp();
    }, 5000);
}

function toggleBaselineButton(baseline){
	// We have two baseline buttons, they are the same except we change the text for the second.
	if(baseline){
		$('#btnToggleTestStatus1 i:first').attr('class','icon icon-ok icon-white');
		$('#btnToggleTestStatus2 i:first').attr('class','icon icon-ok icon-white');
		$('#btnToggleTestStatus2 span').text('Mark as baseline');
		$('#btnToggleTestStatus1').attr('class','btn btn-success btn-state');
		$('#btnToggleTestStatus2').attr('class','btn btn-success');
		
		$("#benchmarkLabel_det").animate({'opacity':'0'});
	} else {		
		$('#btnToggleTestStatus1 i:first').attr('class','icon icon-remove');
		$('#btnToggleTestStatus2 i:first').attr('class','icon icon-remove');
		$('#btnToggleTestStatus2 span').text('Remove baseline status');
		$('#btnToggleTestStatus1').attr('class','btn btn-state');
		$('#btnToggleTestStatus2').attr('class','btn btn-state');

		$("#benchmarkLabel_det").animate({'opacity':'100'});
		window.setTimeout( function(){
	        $("#benchmarkLabel_det").animate({'opacity':'0'});
	    }, 20000);
	}
}

function getBenchmarkStatus(testid, checkOnly) {
	var sDbname=cDBNAME//localStorage.getItem("config_dbname");
	var sDbpass=cDBPASS//localStorage.getItem("config_dbpass");	
	var sDbuser=cDBUSER//localStorage.getItem("config_dbuser");
	var sDbhost=cDBHOST//localStorage.getItem("config_dbhost");
	
	var postParams = 'testid='+testid+'&check='+checkOnly+'&dbname='+sDbname+'&dbpass='+sDbpass+'&dbuser='+sDbuser+'&dbhost='+sDbhost;
	
	var postURL = 'php/benchmark-status.php';
	
	$.post(postURL, postParams, toggleResults, "text");
	
	
	console.log('checkONly: '+checkOnly)
	
	function toggleResults(result)
	{
		var obj = JSON.parse(result);
		
		if(checkOnly){
			// The page was launched usng a permalink URL so just update the labels
			if (obj.statusVal==='Y') {
				toggleBaselineButton(false);
			} else {
				toggleBaselineButton(true);
			}
		} else {
			
		// Set a flag to highlight which tests are 'accepted'.
			$.each(objDataTable_det.fnGetNodes(), function(index, value) {
			     if($(value).find("td").eq(0).text()===testid){
					if(obj.statusVal=='N'){
						$(value).css('color', '#000000');
						$(value).find("td").eq(8).text('N');

					} else {
						$(value).css('color', '#4169E1');
						$(value).find("td").eq(8).text('Y');
					}
				}
			});

			if(obj.statusVal=='Y'){
				toggleBaselineButton(false);
			} else {
				toggleBaselineButton(true);
	
			}
		}	
	}	
}

function initialiseWhereClauses() {
	whereTransaction = "";
	whereHost = "";
	whereCode = "";
	
	whereTransaction_cp0 = "";
	whereHost_cp0 = "";
	whereCode_cp0 = "";
	
	whereTransaction_cp1 = "";
	whereHost_cp1 = "";
	whereCode_cp1 = "";
}

function setElapsedFilter(value, dest){
	console.log('value: '+value+' dest: '+dest);
	
	var elapsedBefore, elapsedAfter;
		var values = new Array();
	
	if(value.charAt(0)==='>'){
		//Then the last column was clicked
		elapsedBefore=value.substr(1,value.length-1);
		elapsedAfter=9999999999999; // A very big number - elapsed will always be less than this.
	} else {
		values = value.split(' ');
		elapsedBefore=values[0];
		elapsedAfter=values[2];
	}
	
	
}

function setWhereClause(type, value, dest) {
	
	// Hide permaLink if shown
	$("#inputPermalink").blur();
	
	var arrValues=[];
	
	if($.isArray(value)) {
		arrValues=value;
	} else {	
		arrValues[0]=value;
	}
	
	//console.log('type:'+type);
	//console.log('value:'+value);
	//console.log('dest:'+dest);		
	
	firstLoop=true;
	switch (type) {		
		case 'Transaction': {
			for (var i in arrValues) {
				if(firstLoop) { // If this is the first time we are adding to the string then use AND, not OR
					transactionString='';
					transactionString += ' AND (label=\''+arrValues[i]+'\'';
				} else {
					transactionString += ' OR label=\''+arrValues[i]+'\'';
				}
				firstLoop=false;
			}
			transactionString+=')';
			
			switch (dest){
				case '_det':{
					whereTransaction=transactionString;
					paramLabel=JSON.stringify(arrValues);
					// TODO: We also need to have a paramLabel for the comp view
				}
				break;
				case '_cp0':{
					whereTransaction_cp0=transactionString;
				}
				break;
				case '_cp1':{
					whereTransaction_cp1=transactionString;		
				}
				break;
			}
		}
		break;
		case 'Host': {
			for (var i in arrValues) {
				if(firstLoop) { // If this is the first time we are adding to the string then use AND, not OR
					hostString='';
					hostString += ' AND hostname=\''+arrValues[i]+'\'';
				} else {
					hostString += ' OR hostname=\''+arrValues[i]+'\'';
				}
				firstLoop=false;
			}
			switch (dest){
				case '_det':{
					whereHost=hostString;
					paramHost=arrValues[0];  // Only one value in this array
				}
				break;
				case '_cp0':{
					whereHost_cp0=hostString;
				}
				break;
				case '_cp1':{
					whereHost_cp1=hostString;	
				}
				break;
			}
		}
		break;
		case 'Code': {
			for (var i in arrValues) {
				if(firstLoop) { // If this is the first time we are adding to the string then use AND, not OR
					codeString='';
					codeString += ' AND responsecode=\''+arrValues[i]+'\'';
				} else {
					codeString += ' OR responsecode=\''+arrValues[i]+'\'';
				}
				firstLoop=false;
			}
			switch (dest){
				case '_det':{
					whereCode=codeString;
					paramCode=arrValues[0]; // Only one value in this array
				}
				break;
				case '_cp0':{
					whereCode_cp0=codeString;
				}
				break;
				case '_cp1':{
					whereCode_cp1=codeString;	
				}
				break;
			}
		}
		break;
		default:{
			console.log('setWhereClause | Invalid type: '+type)
		}
	}
	

	//$('#statusFilter').text('Filter: On');
	//$('#statusFilter').attr('class','label label-info');
	//$('#btnResetFilter').attr('class','btn btn-primary btn-mini');
}

function clickAggregateTable(therow, type) {
	// handles table clicks on the aggregate table and on the filter table (comp view)
	switch (type){
		case '_det':{
			if ($('#chkAgg'+$(therow).index()).prop("checked")) {
				$('#chkAgg'+$(therow).index()).prop("checked", false);
				$(therow).css("font-weight","normal");
			} else {
				$('#chkAgg'+$(therow).index()).prop("checked", true);
				$(therow).css("font-weight","bold");		
			}
			
			// if all checkbox are selected, check the selectall checkbox
    		// and viceversa
			if($(".chcktbl").length == $(".chcktbl:checked").length) {
	            $("#selectAll").attr("checked", "checked");
	        } else {
	            $("#selectAll").removeAttr("checked");
	        }
	
			// Enable the filter button when at least one row is checked
			if($(".chcktbl:checked").length>0){
				$('#btnAggDrillDown').removeAttr("disabled");
			} else {
				$('#btnAggDrillDown').attr("disabled", "disabled");
			}
		}
		break;
		case '_cp0':{
			if ($('#chkAgg'+$(therow).index()+'_cp0').prop("checked")) {
				$('#chkAgg'+$(therow).index()+'_cp0').prop("checked", false);
				$(therow).css("font-weight","normal");
			} else {
				$('#chkAgg'+$(therow).index()+'_cp0').prop("checked", true);
				$(therow).css("font-weight","bold");		
			}
		}
		break;
		case '_cp1':{
			if ($('#chkAgg'+$(therow).index()+'_cp1').prop("checked")) {
				$('#chkAgg'+$(therow).index()+'_cp1').prop("checked", false);
				$(therow).css("font-weight","normal");
			} else {
				$('#chkAgg'+$(therow).index()+'_cp1').prop("checked", true);
				$(therow).css("font-weight","bold");		
			}
		}
		break;
		default:{
			//
		}
	}
		
}

function clickRefreshButton(type){
	
	// Refreshes the tests table by calling autocomplete
	// For now, type is always '_det'
	$('#btnRefresh'+type).button('loading');
	$('#autocomplete'+type).autocomplete('search', '');
	$('#autocomplete'+type).val('');
}

function filterByTableSelection(dest){
	
	//TODO - if you rename the main aggregate rowid (chkAgg) to use _det you don't need a switch here
	
	switch(dest){
		case '_det':{
			var aggFilter = [];
			var table = document.getElementById('bodyAggregate_det');
			for (var i=0; i<table.rows.length; i++) { 
				if ($('#chkAgg'+i).attr('checked')) {
					aggFilter.push(table.rows[i].cells[1].innerText);
				}
			}

			setWhereClause('Transaction', aggFilter, dest);
			prepareDetailQueries(document.getElementById('inputTestid_det').value);
			if(whereTransaction){$("#selectAll").attr("checked", "checked");}
		}
		break;
		case '_cp0':{
			var aggFilter = [];
			var table = document.getElementById('cpTbodyLabels_cp0');
			for (var i=0; i<table.rows.length; i++) { 
				if ($('#chkAgg'+i+'_cp0').attr('checked')) {
					aggFilter.push(table.rows[i].cells[1].innerText);
				}
			}
			
			setWhereClause('Transaction', aggFilter, dest);
			
			// TODO - the function calls below sum up to a refresh of the comp view - group in a function?
			buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
			buildTransactionComparison(document.getElementById('inputTestid_cp0').value,document.getElementById('inputTestid_cp1').value);
		}
		break;
		case '_cp1':{
			var aggFilter = [];
			var table = document.getElementById('cpTbodyLabels_cp1');
			for (var i=0; i<table.rows.length; i++) { 
				if ($('#chkAgg'+i+'_cp1').attr('checked')) {
					aggFilter.push(table.rows[i].cells[1].innerText);
				}
			}
			
			setWhereClause('Transaction', aggFilter, dest);
			
			buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
			buildTransactionComparison(document.getElementById('inputTestid_cp0').value,document.getElementById('inputTestid_cp1').value);
		}
		break;
		default:{
			//
		}
	}	
}

function resetZoom(noRefresh) {
	// Resets the zoom by clearing the min and max vars and redrawing each control.
	min_det=0;
	min_cp0=0;
	min_cp1=0;
	max_det=99999999999999;
	max_cp0=99999999999999;
	max_cp1=99999999999999;
	
	// TODO - check if any zoom is active before refreshing the page
	// TODO - expand for comparison page
	
	if(!noRefresh) {
		prepareDetailQueries(document.getElementById('inputTestid_det').value);
	} //If called when first building the page then don't try to refresh the detail graphs.
	
	// set zoom status
	zoomStatus(false);
}

function zoomStatus(status){
	if(status) {
		$('#statusZoom').text('Zoom: On');
		$('#statusZoom').attr('class','label label-info');
		$('#btnResetZoom').attr('class','btn btn-primary btn-mini');
	} else {
		$('#statusZoom').text('Zoom: Off');
		$('#statusZoom').attr('class','label');
		$('#btnResetZoom').attr('class','btn btn-mini');
	}
}

function resetFilter(type, noRefresh) {
	//console.log('type: '+type+' whereCode: '+whereCode);
	if (whereTransaction!='' || whereHost!='' || whereCode!='') {
		switch (type) {		
			case 'Transaction': {
				whereTransaction = "";
				paramLabel="";
				// Uncheck the select all checkbox on the aggregate table
				$("#selectAll").removeAttr("checked");
				break;
			}
			case 'Host': {
				whereHost = "";
				paramHost="";
				break;
			}
			case 'Code': {
				whereCode = "";
				paramCode="";
				break;
			}
			case 'All': {
				whereHost = "";
				whereCode = "";
				whereTransaction = "";
				paramLabel="";
				paramHost="";
				paramCode="";
				// Uncheck the select all checkbox on the aggregate table
				$("#selectAll").removeAttr("checked");
				break;
			}
			default : { // Currently the main request sends no params and ends up here
				whereHost = "";
				whereCode = "";
				whereTransaction = "";
				paramLabel="";
				paramHost="";
				paramCode="";
				break;
			}
		}
		if(!noRefresh) {prepareDetailQueries(document.getElementById('inputTestid_det').value);} //If called from createSummaryView then don't try to refresh the detail graphs.
	}
	//$('#statusFilter').text('Filter: Off');
	//$('#statusFilter').attr('class','label');
	//$('#btnResetFilter').attr('class','btn btn-mini');
	
}

function createResultsTable(){  
	var createStatement = 	'CREATE TABLE IF NOT EXISTS'
	+	' results(	'
	+ 	'id INTEGER NOT NULL PRIMARY KEY,'
	+	'testid INTEGER NOT NULL,'
	+	'timestamp INTEGER NOT NULL, '
	+	'ts_aggregate INTEGER NOT NULL, '
	+	'elapsed INTEGER, '
	+	'min_elapsed INTEGER, '
	+	'max_elapsed INTEGER, '
	+	'responsecode INTEGER, '
	+	'label TEXT, '
	+	'success_count INTEGER, '
	+	'success_tps FLOAT, '
	+	'fail_count INTEGER, '
	+	'fail_tps FLOAT, '
	+	'bytes INTEGER, '
	+	'bytes_tps INTEGER, '
	+	'grpthreads INTEGER, '
	+	'allthreads INTEGER, '
	+	'latency INTEGER, '
	+	'hostname TEXT);'
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(createStatement, [], successHandler, errorHandler);  
		}  
	); 
	function errorHandler(transaction, error){
		if (error.code==1){
			// DB Table already exists
		} else {
			// Error is a human-readable string.
			console.log('Oops.  Error was '+error.message+' (Code '+error.code+')');
		}
		return false;
	}

	function successHandler(){
		var createIndexStatement = 	'CREATE INDEX idxTestId'
		+	' ON results(	'
		+ 	'testid );'

		JMETERDB.transaction(  
			function (transaction) {  
				transaction.executeSql(createIndexStatement, [], nullDataHandler, errorHandler);  
			}  
		); 
		function errorHandler(transaction, error){
			if (error.code==1){
				// DB Table already exists
			} else {
				// Error is a human-readable string.
				console.log('Oops.  Error was '+error.message+' (Code '+error.code+')');
			}
			return false;
		}

		function nullDataHandler(){
			//console.log("SQL Query Succeeded");
		}
	}
}
/*
function createTestsTable(){  
	var createStatement = 	'CREATE TABLE IF NOT EXISTS'
	+	' tests(	'
	+ 	'id INTEGER NOT NULL PRIMARY KEY,'
	+	'testid INTEGER NOT NULL,'
	+	'buildlife TEXT, '
	+	'project TEXT, '
	+	'environment TEXT, '
	+	'value4 TEXT, '
	+	'value5 TEXT, '
	+	'value6 TEXT, '
	+	'value7 TEXT, '
	+	'value8 TEXT, '
	+	'value9 TEXT, '
	+	'value10 TEXT);'

	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(createStatement, [], nullDataHandler, errorHandler);  
		}  
	); 
	function errorHandler(transaction, error){
		if (error.code==1){
			// DB Table already exists
		} else {
			// Error is a human-readable string.
			console.log('Oops.  Error was '+error.message+' (Code '+error.code+')');
		}
		return false;
	}

	function nullDataHandler(){
		//console.log("SQL Query Succeeded");
	}
}
*/

function getURLParameter(name) {
	return decodeURI(
		(RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
	);
}

function prepareDetailQueries(iTestid) {

	// Set timestamp limits
	iMin=min_det;
	iMax=max_det;
	
	// Show overlay
	$('#overlay').show();
	
	// Build query strings						
	var querySummary =   ' SELECT'
	+' MAX(timestamp) as max_timestamp,'
	+' MIN(timestamp) as min_timestamp,'
	+' SUM(success_tps) as success_tps,'
	+' SUM(fail_tps) as fail_tps'
	+' FROM results'
	+' WHERE testid = '+iTestid;
	querySummary=addQueryFilters(querySummary, '_det');
	querySummary+=' GROUP BY ts_aggregate;';

	var queryBytes =	'SELECT MAX(timestamp) as max_timestamp, '
	+'SUM(bytes_tps) as bytes_tps '
	+'FROM results '
	+'WHERE testid ='+iTestid;
	queryBytes=addQueryFilters(queryBytes, '_det');
	queryBytes+=' GROUP BY ts_aggregate;';

	var queryElapsed =	'SELECT MAX(timestamp) as max_timestamp, '
	+'SUM(elapsed * (success_count + fail_count)) as elapsed, ' // weighted (we divide this by the count later)
	+'SUM(success_count) as success_count, '
	+'SUM(fail_count) as fail_count '
	+'FROM results '
	+'WHERE testid ='+iTestid;
	queryElapsed=addQueryFilters(queryElapsed, '_det');
	queryElapsed+=' GROUP BY ts_aggregate;';

	var queryHostSuccess = 'SELECT '
	+' SUM(success_count) as success_count, '
	+' SUM(fail_count) as fail_count, '
	+' hostname FROM results '
	+' WHERE testid ='+iTestid;
	queryHostSuccess=addQueryFilters(queryHostSuccess, '_det');
	queryHostSuccess+=' GROUP BY hostname;';

	var queryTransSuccess = 'SELECT '
	+' SUM(success_count) as success_count, '
	+' SUM(fail_count) as fail_count, '
	+' label FROM results '
	+' WHERE testid ='+iTestid;
	queryTransSuccess=addQueryFilters(queryTransSuccess, '_det');
	queryTransSuccess+=' GROUP BY label;';

	var queryThreads = 'SELECT MAX(maxTimestamp) as maxTimestamp, '
	+'sum(avgThreads) as sum_threads '
	+'FROM (SELECT '
		+' MAX(timestamp) as maxTimestamp,'
		+' ts_aggregate,'
		+' hostname,'
		+' avg(allthreads) as avgThreads'
		+' FROM results'
		+' WHERE testid = '+iTestid
		+  whereHost
		+' AND timestamp < '+iMax
		+' AND timestamp > '+iMin
		+' GROUP BY ts_aggregate, hostname'
		+')'
	+' GROUP BY ts_aggregate';

	var queryTransBreakdown = 'SELECT '
	+' MIN(min_elapsed) as min_elapsed, '
	+' ROUND(AVG(elapsed)) as avg_elapsed, '
	+' MAX(max_elapsed) as max_elapsed, '
	+' label FROM results '
	+' WHERE testid ='+iTestid;
	queryTransBreakdown=addQueryFilters(queryTransBreakdown, '_det');
	queryTransBreakdown+=' GROUP BY label;';

	var queryBarDistribution = 'SELECT'
	+' SUM(success_count + fail_count) as count,'
	+' label FROM results'
	+' WHERE testid ='+iTestid;
	queryBarDistribution=addQueryFilters(queryBarDistribution, '_det');
	queryBarDistribution+=' GROUP BY label;';

	var queryBarResponses = 'SELECT'
	+' SUM(success_count+fail_count) as count,'
	+' responsecode'
	+' FROM results'
	+' WHERE testid ='+iTestid;
	queryBarResponses=addQueryFilters(queryBarResponses, '_det');
	queryBarResponses+=' GROUP BY responsecode;';
	
	// Create label for Summary graph
	var summaryLabel='Requests per Second - Test ID: '+iTestid+' | ';
	
	// Build graphs
	buildDetailGraph(querySummary, 'graphSummary', summaryLabel, 'graphSummary', '_det');
	buildDetailGraph(queryBytes, 'graphBytes', 'Bytes', 'graphBytes', '_det');
	buildDetailGraph(queryElapsed, 'graphElapsed', 'Milliseconds', 'graphElapsed', '_det');
	buildDetailGraph(queryHostSuccess, 'graphHostSuccess','', 'graphHostSuccess', '_det');
	buildDetailGraph(queryTransSuccess, 'graphTransSuccess','', 'graphTransSuccess', '_det');
	buildDetailGraph(queryThreads, 'graphThreads', "Virtual Users", 'graphThreads', '_det');
	buildDetailGraph(queryTransBreakdown, 'graphTransBreakdown','', 'graphTransBreakdown', '_det');
	buildDetailGraph(queryBarDistribution, 'barDistribution','', 'barDistribution', '_det');
	buildDetailGraph(queryBarResponses, 'barResponses','', 'barResponses', '_det');
	
	buildAggregateTable(iTestid, '_det');
	buildFrequencyGraph(iTestid, '_det');
	buildRespByTransaction(iTestid, '_det');
	buildThroughputByCode(iTestid, '_det');
	
	queryOverallResults(iTestid, '_det');
}

function buildDetailGraph(query, name, label, container, dest){  

	//Using query, we select the results from the local database
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(query, [],  
				dataSelectHandler, errorHandler);  
		}  
	);  

	function dataSelectHandler(transaction, results){  

		var dataset=results.rows;
		var item;
		switch(name)
		{
			case 'graphSummary':{
				var  seriesArray1 = [];
				var  seriesArray2 = [];
				var dataset=results.rows;
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);
					seriesArray1.push([item['max_timestamp'],item['success_tps']]);
					seriesArray2.push([item['max_timestamp'],item['fail_tps']]);
				}

				var startDate=new Date(item['min_timestamp']);

				// Title sting
				var title=label+startDate;
				var subTitle = 'Click and drag in the plot area to analyse a particular range.';

				// Here we build the highcharts graph using the query results and put it in the given div
				
				chartSummary = new Highcharts.Chart(lineDouble(seriesArray1, seriesArray2, name, title, "per/second", "", "Successful Requests (p/sec)", "Errors (p/sec)",subTitle, true, dest));

				// Mark success
				$('#inputSummaryGraphStatus').text('complete');
			}
			break;
			case 'graphTPS': {				
				//Now we need to build two json strings, one for each series
				var  seriesArray1 = [];
				var  seriesArray2 = [];
				var dataset=results.rows;
				
				//console.log('graphTPS rows: '+results.rows.length)
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);
					seriesArray1.push([item['max_timestamp'],item['success_tps']]);
					seriesArray2.push([item['max_timestamp'],item['fail_tps']]);
				}

				var startDate=new Date(item['min_timestamp']);

				// Title sting
				title='Requests per Second'//' - Test ID: '+testid+' | '+startDate;


				// Here we build the highcharts graph using the query results and put it in the given div
				var subTitle = 'Click and drag in the plot area to analyse a particular range.';
				chartTPS = new Highcharts.Chart(lineDouble(seriesArray1, seriesArray2, container, title, "per/second", "", "Successful Requests (p/sec)", "Errors (p/sec)",subTitle, true, dest));
			}
			break;
			case 'graphBytes': {
				//Now we need to build a json string
				var seriesArray = [];
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);

					seriesArray.push([item['max_timestamp'],item['bytes_tps']]);
				}
				// Here we build the highcharts graph using the query results and put it in the given div
				chartBytes = new Highcharts.Chart(lineSingle(seriesArray, container, "", label, "", label, "b", true, dest));
			}
			break;
			case 'graphElapsed': {
				var seriesArray = [];
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);
					// Average resp times are a bit different, we need to find the weighted avg
					var total_count=item['success_count']+item['fail_count'];
					var weightedAvg=item['elapsed']/total_count;
					seriesArray.push([item['max_timestamp'],weightedAvg]);
				}
				// Here we build the highcharts graph using the query results and put it in the given div
				chartElapsed = new Highcharts.Chart(lineSingle(seriesArray, container, "", label, "", label, "ms", true, dest));
			}
			break;		
			case 'graphHostSuccess': {
				var  passArray = [];
				var  failArray = [];
				var  categoryArray = [];

				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);
					passArray.push(item['success_count']);
					failArray.push(item['fail_count']);				
					categoryArray.push(item['hostname']);
				}

				// Just before building the graph we set the div height for it's container based on how many rows we have
				var divHeight = i * 60 + 100 + 'px'
				div = document.getElementById(name);
				div.style.height=divHeight;

				// Here we build the highcharts graph using the query results and put it in the given div
				chartHostSuccess= new Highcharts.Chart(barPassFail(passArray, failArray, categoryArray, name, 'Host', '', true, dest));
			}
			break;
			case 'graphTransSuccess': {
				//Now we need to build a json string
				var  passArray = [];
				var  failArray = [];
				var  categoryArray = [];

				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);
					passArray.push(item['success_count']);
					failArray.push(item['fail_count']);				
					categoryArray.push(item['label']);
				}

				// Just before building the graph we set the div height for it's container based on how many rows we have
				if(i>0){
					var divHeight = i * 60 + 100 + 'px'
					div = document.getElementById(name);
					div.style.height=divHeight;
				}

				// Here we build the highcharts graph using the query results and put it in the given div
				chartTransSuccess= new Highcharts.Chart(barPassFail(passArray, failArray, categoryArray, name, 'Transaction', '', true, dest));
			}
			break;
			case 'graphThreads': {
				//Now we need to build a json string
				var seriesArray = [];
				var threadCount;
				//console.log('whereTransaction: '+whereTransaction);
				//console.log('whereHost: '+whereHost);	
				// It is not possible to drill down by Transaction as thread counts are stored by threadgroup and testplan levels only.
				// But we can query by Host as host ID is kept in the thesultset.
				
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);

					threadCount=item['sum_threads'];
					seriesArray.push([item['maxTimestamp'],threadCount]);
				}
				// Here we build the highcharts graph using the query results and put it in the given div
				chartThreads = new Highcharts.Chart(lineSingle(seriesArray, name, "", label, "", label, "users", true, dest));
			}
			break;
			case 'graphTransBreakdown': {
				//Now we need to build a json string
				var  minArray = [];
				var  avgArray = [];
				var  maxArray = [];
				var  categoryArray = [];

				var tAvg=0;

				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);

					minArray.push(item['min_elapsed']);
					avgArray.push(item['avg_elapsed']);
					maxArray.push(item['max_elapsed']);				
					categoryArray.push(item['label']);
					
					// you can set the colour for a point like this:
					//series.data.push({ y: parseInt(Data[i]), color: '#FF0000' });
					//or:
					//
					//series.data.push({ y: weightedAvg, color: 'red' });
					
				}

				// Just before building the graph we set the div height for it's container based on how many rows we have
				var divHeight = i * 60 + 100 + 'px'
				div = document.getElementById(name);
				div.style.height=divHeight;

				// Here we build the highcharts graph using the query results and put it in the given div
				chartTransBreakdown= new Highcharts.Chart(barTransBreakdown(minArray, avgArray, maxArray, categoryArray, container, '', '', true, dest));
			}
			break;
			case 'cpRespTimeBreakdown': {
				//Now we need to build a json string
				var  arrPercentages = [];
				var  categoryArray = [];

				var tAvg=0;

				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);

					arrPercentages.push(push({ y: weightedAvg, color: 'red' }));
					arrPercentages.push(item['max_elapsed']);				
					categoryArray.push(item['label']);
					
					// you can set the colour for a point like this:
					//series.data.push({ y: parseInt(Data[i]), color: '#FF0000' });
					//or:
					//
					//series.data.push({ y: weightedAvg, color: 'red' });					
				}

				// Just before building the graph we set the div height for it's container based on how many rows we have
				//var divHeight = i * 60 + 100 + 'px'
				//div = document.getElementById(name);
				//div.style.height=divHeight;

				// Here we build the highcharts graph using the query results and put it in the given div
				chartTransBreakdown= new Highcharts.Chart(barTransBreakdown(arrPercentages, '', '', categoryArray, container, '', '', false, dest));
			}
			break;
			case 'barDistribution': {
				//Now we need to build a json string
				var pointsArray = [];
				var categoryArray = [];
				var sumCount=0;
				var percentageCount=0;
				
				// Calculate the total sum
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);	
					sumCount+=parseInt(item['count']);
				}
				
				// Loop through again calculating the percentage and pushing to the array
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);
					// Percentage calculation
					percentageCount=item['count']/sumCount*100;
					// Remove excessive decimel places
					percentageCount=percentageCount.toFixed(2);
					// Highcharts wants numeric values
					percentageCount=parseFloat(percentageCount, 2);
					
					pointsArray.push(percentageCount);
					categoryArray.push(item['label']);
				}

				// Here we build the highcharts graph using the query results and put it in the given div
				chartBarDistribution= new Highcharts.Chart(barDistribution (pointsArray, categoryArray, name, '', '%', 'Transaction', true, dest));
			}
			break;
			case 'barResponses': {
				var pointsArray = [];
				var categoryArray = [];
				var sumCount=0;
				var percentageCount=0;
				
				// Calculate the total sum
				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);		
					sumCount+=parseInt(item['count']);;
				}

				for (var i=0; i<results.rows.length; i++) {
					item = dataset.item(i);	
					// Percentage calculation
					percentageCount=item['count']/sumCount*100;
					// Remove excessive decimel places
					percentageCount=percentageCount.toFixed(2);
					// Highcharts wants numeric values
					percentageCount=parseFloat(percentageCount, 2);
												
					pointsArray.push(percentageCount);
					categoryArray.push(item['responsecode']);
				}
			
				// Here we build the highcharts graph using the query results and put it in the given div
				$('#divErrors').removeAttr('style');
				chartBarResponses= new Highcharts.Chart(barDistribution (pointsArray, categoryArray, name, '', '%', 'Response Code', true, dest));
			}
			break;
			default:
			//
		}
	}
	function errorHandler(transaction, error) {
		console.log('Error! query: '+query);
		alert(error.message);
	}
}	

function comparisonBreakdown(type){
	switch (type) {
		case 'response' : {
			$('#divCompRespBreakdown').slideToggle("slow",function(){
				switch($(this).css('display')){
					case 'block' :{
						$('#cpResptimeIndicator').text(' Less ');
						$('#cpResptimeIcon').attr('class','icon-arrow-up');
					}
					break;
					case 'none' :{
						$('#cpResptimeIndicator').text(' More ');
						$('#cpResptimeIcon').attr('class','icon-arrow-down');
					}
					break;
					default:{
						console.log('Invalid style attribute: '+$(this).css('display')+' on slideToggle | object: '+$(this))
					}
				}
			});
		}
		break;
		case 'throughput' : {
			$('#divCompThroughputBreakdown').slideToggle("slow",function(){
				switch($(this).css('display')){
					case 'block' :{
						$('#cpThroughputIndicator').text(' Less ');
						$('#cpThroughputIcon').attr('class','icon-arrow-up');
					}
					break;
					case 'none' :{
						$('#cpThroughputIndicator').text(' More ');
						$('#cpThroughputIcon').attr('class','icon-arrow-down');
					}
					break;
					default:{
						console.log('Invalid style attribute: '+$(this).css('display')+' on slideToggle | object: '+$(this))
					}
				}
			});
		}
		break;
		case 'bytes' : {
			$('#divCompBytesBreakdown').slideToggle("slow",function(){
				switch($(this).css('display')){
					case 'block' :{
						$('#cpBytesIndicator').text(' Less ');
						$('#cpBytesIcon').attr('class','icon-arrow-up');
					}
					break;
					case 'none' :{
						$('#cpBytesIndicator').text(' More ');
						$('#cpBytesIcon').attr('class','icon-arrow-down');
					}
					break;
					default:{
						console.log('Invalid style attribute: '+$(this).css('display')+' on slideToggle | object: '+$(this))
					}
				}
			});
		}
		break;
		case 'search' : {
			/*
			$('#cpSearchContainer').slideToggle("slow",function(){
				switch($(this).css('display')){
					case 'block' :{
						$('#cpSearchIndicator').text(' Hide Search ');
						$('#cpSearchIcon').attr('class','icon-arrow-up');
					}
					break;
					case 'none' :{
						$('#cpSearchIndicator').text(' Show Search ');
						$('#cpSearchIcon').attr('class','icon-arrow-down');
					}
					break;
					default:{
						console.log('Invalid style attribute: '+$(this).css('display')+' on slideToggle | object: '+$(this))
					}
				}
			});
			*/
		}
		break;
		default : {
			console.log('Invalid type: '+type)
		}
	}
}

function prepareComparisonView(testidBefore, testidAfter) {
	
	// Show overlay - we remove this after the second call to buildTransactionComparison()
	$('#overlay').show();
	
	// Set the toolbar text
	toolbarText_cp='Test ID: '+testidBefore+' VS. '+testidAfter;
	
	// Show the comparison div
	containerVisibility('hide', 'hide', 'hide', 'down');
	
	// Populate the test labels at the top of the page.
	$.each(objDataTable_det.fnGetNodes(), function(index, value) {
	     if($(value).find("td").eq(0).text()===testidBefore){
			$('#labelTestid_cp0').html('<span class="badge badge-info">'+testidBefore+'</span>');
			$('#labelProject_cp0').html('<span class="badge badge-info">'+$(value).find("td").eq(5).text()+'</span>');
			$('#labelDate_cp0').html('<span class="badge badge-info">'+$(value).find("td").eq(3).text()+'</span>');
			$('#labelRelease_cp0').html('<span class="badge badge-info">'+$(value).find("td").eq(4).text()+'</span>');
			$('#labelEnv_cp0').html('<span class="badge badge-info">'+$(value).find("td").eq(6).text()+'</span>');
			$('#labelComment_cp0').html('<span class="badge badge-info">'+$(value).find("td").eq(7).text()+'</span>');
		}
		
		
		
	     if($(value).find("td").eq(0).text()===testidAfter){
			$('#labelTestid_cp1').html('<span class="badge badge-info">'+testidAfter+'</span>');
			$('#labelProject_cp1').html('<span class="badge badge-info">'+$(value).find("td").eq(5).text()+'</span>');
			$('#labelDate_cp1').html('<span class="badge badge-info">'+$(value).find("td").eq(3).text()+'</span>');
			$('#labelRelease_cp1').html('<span class="badge badge-info">'+$(value).find("td").eq(4).text()+'</span>');
			$('#labelEnv_cp1').html('<span class="badge badge-info">'+$(value).find("td").eq(6).text()+'</span>');
			$('#labelComment_cp1').html('<span class="badge badge-info">'+$(value).find("td").eq(7).text()+'</span>');
		}
	});
	
	
	// Reset global filters
	min_cp0='';
	max_cp1='';
	whereTransaction_cp0='';
	whereTransaction_cp1='';
	whereHost_cp0='';	
	whereHost_cp1='';
	
	// build a simple array with two values, testid1 & 2
	//Then repeat the same steps, for each side of the comparison
	var arrCompTestids=[];
	arrCompTestids.push(testidBefore);
	arrCompTestids.push(testidAfter);
	
	for (i in arrCompTestids) {
		
		//We first need to check if the data is present in local storage, get it if it is not and then build the graphs.
		checkIfResultsExist(arrCompTestids[i], '_cp'+i);
	}
	
	// Add a menu item to link to the comp view
	$("#ulNavbar li").remove('.liAppendedComp');
	$("#ulNavbar").append('<li class="liAppendedComp" id="liComparison"><a onclick="containerVisibility(\'hide\',\'hide\',\'hide\',\'show\')">COMPARISON: [Test ID '+testidBefore+' vs. Test ID '+testidAfter+']</a></li>');
	$("#ulNavbar").append('<li class="divider-vertical liAppendedComp"></li>');
}

function addQueryFilters(queryString, dest) {	
	// Function to add any global filters that might be set	

	switch(dest) {
		// Add any active filters - these are global vars set by clicking on the graphs
		case '_det':{
			queryString			+= whereTransaction
								+  whereHost
								+  whereCode;
			// Only add the filter for max time if it is defined
			if(max_det>0) {
				queryString		+=' AND timestamp < '+max_det;
			}
			// Only add the filter for min time if it is defined
			if(min_det>0) {
				queryString		+=' AND timestamp > '+min_det;
			}		
		}
		break;
		case '_cp0':{
			queryString			+= whereTransaction_cp0
								+  whereHost_cp0
								+  whereCode_cp0;
			// Only add the filter for max time if it is defined
			if(max_cp0>0) {
				queryString		+=' AND timestamp < '+max_cp0;
			}
			// Only add the filter for min time if it is defined
			if(min_cp0>0) {
				queryString		+=' AND timestamp > '+min_cp0;
			}
		
		}
		break;
		case '_cp1':{
			queryString			+= whereTransaction_cp1
								+  whereHost_cp1
								+  whereCode_cp1;
			// Only add the filter for max time if it is defined
			if(max_cp1) {
				queryString		+=' AND timestamp < '+max_cp1;
			}
			// Only add the filter for min time if it is defined
			if(min_cp1) {
				queryString		+=' AND timestamp > '+min_cp1;
			}
		
		}
		break;
		default:{
			// do nothing
		}
	}
	return queryString;
}

function buildComparisonView(compTestid, dest) {

	// Function to build the filter view
	function getLabelNames(testid, dest) {
		// This function gets all label names (transactions) for a test and populates the multicon 
		// selector in the filter view
		var query = 'SELECT'
		+' label as label'
		+' FROM results'
		+' WHERE testid ='+testid
		+' GROUP BY label;';

		JMETERDB.transaction(  
			function (transaction) {  
				transaction.executeSql(query, [],  
					successGetLabelNames, errorGetLabelNames);  
			}  
		);  

		function successGetLabelNames(transaction, results){
			var item, 
				dataset=results.rows,
				label, 
				labelHtml='';
				
			for (var i=0; i<results.rows.length; i++) {
				item = dataset.item(i);
				label = item['label'];

				// Create one aggregate row per transaction
				labelHtml+="<tr onclick=\"clickAggregateTable(this, \'"+dest+"\')\">";
				labelHtml+='<td><input type="checkbox" onclick="this.checked=!this.checked;" id="chkAgg'+i+dest+'"class="chcktbl" /></td>';
				labelHtml+='<td>'+label+'</td>';
			}
			
			switch(dest){
				case '_cp0':{
					$('#cpTbodyLabels_cp0').html(labelHtml);
				}
				break;
				case '_cp1':{
					$('#cpTbodyLabels_cp1').html(labelHtml);
				}
				break;
			}
		}

		function errorGetLabelNames(transaction, error){
			console.log('Error! '+error.message)
		}			
	}
	// Build the filter view
	getLabelNames(compTestid, dest);

	// Build query strings	
	var queryTPS =   			' SELECT'
								+' MAX(timestamp) as max_timestamp,'
								+' MIN(timestamp) as min_timestamp,'
								+' SUM(success_tps) as success_tps,'
								+' SUM(fail_tps) as fail_tps'
								+' FROM results '
								+' WHERE testid = '+compTestid;
	queryTPS=addQueryFilters(queryTPS, dest);
	queryTPS+=					' GROUP BY ts_aggregate;';	
								

	var queryElapsed =	' SELECT MAX(timestamp) as max_timestamp,'
						+' SUM(elapsed * (success_count + fail_count)) as elapsed,' // weighted (we divide this by the count later)
						+' SUM(success_count) as success_count,'
						+' SUM(fail_count) as fail_count'
						+' FROM results'
						+' WHERE testid ='+compTestid;
	queryElapsed=addQueryFilters(queryElapsed, dest);
	queryElapsed+=		' GROUP BY ts_aggregate';	
						
	var queryBytes =	'SELECT MAX(timestamp) as max_timestamp, '
						+'SUM(bytes_tps) as bytes_tps '
						+'FROM results '
						+'WHERE testid ='+compTestid;
	queryBytes=addQueryFilters(queryBytes, dest);
	queryBytes+=		' GROUP BY ts_aggregate';
	

	// Request Graphs
	buildDetailGraph(queryTPS, 'graphTPS', 'TPS', 'cpGraphTPS'+dest,dest);
	buildDetailGraph(queryElapsed, 'graphElapsed', 'Milliseconds', 'cpGraphElapsed'+dest,dest);	
	buildDetailGraph(queryBytes, 'graphBytes', 'Bytes', 'cpGraphBytes'+dest,dest);
	
	buildRespByTransaction(compTestid, dest);
	buildFrequencyGraph(compTestid, dest);
	

	calculateComparison(document.getElementById('inputTestid_cp0').value, document.getElementById('inputTestid_cp1').value)
	buildTransactionComparison(document.getElementById('inputTestid_cp0').value, document.getElementById('inputTestid_cp1').value);
}

function calculateComparison(beforeTestid, afterTestid){
	// This function initiates two queryOverallResults() calls, one for each side of the comp.
	// It is actually triggered twice during the initial loading process but this is required because one or other of the sides
	// may not have completed loading (may not have been downloaded from the remote source) but never both becasue
	// (this function is called after the data import process is complete)
	queryOverallResults(beforeTestid, '_cp0');
	queryOverallResults(afterTestid, '_cp1');	
}

function buildRespByTransaction(respTestid, dest) {
	
	// This function was extended to include both response times by transaction and tps by transaction.
	respArray_resp = [];	
	respArray0_resp=[];
	respArray1_resp=[];
	respArray_tps_success = [];	
	respArray_tps_fail = [];
	respArray0_tps=[];
	respArray1_tps=[];
	
	// Get a list of labels
	var queryLabels =     		' SELECT '
								+' label'
								+' FROM results '
								+' WHERE testid = '+respTestid;

	queryLabels=addQueryFilters(queryLabels, dest);
	
	queryLabels+=				' GROUP BY label'+';';
											
			
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(queryLabels, [],  
				resp1Success, resp1Error);  
		}  
	);  

	function resp1Success(transaction, results){ 
		
		//for each label, query to get response times and build an array 
		var dataset=results.rows;
		countLables=results.rows.length;
		var item;
		
		for (var i=0; i<countLables; i++) {
			item = dataset.item(i);
			
			getRespObject(respTestid, item['label'], dest);

		}// end for loop
	}
	function resp1Error(){
		alert('resp1Error');
	}
	
	function getRespObject(roTestid, roLabel, dest) {
		
		var queryRespTimes = 			  ' SELECT MAX(timestamp) as max_timestamp,'
										 +' label as current_label,'
										 +' SUM(elapsed * (success_count + fail_count)) as elapsed,'
   										 +' SUM(success_tps) as success_tps,'
   										 +' SUM(fail_tps) as fail_tps,'
										 +' SUM(success_count) as success_count,'
										 +' SUM(fail_count) as fail_count'
										 +' FROM results'
										 +' WHERE testid ='+roTestid;
		
		queryRespTimes=addQueryFilters(queryRespTimes, dest);
		
		queryRespTimes+=				  ' AND label = \''+roLabel+'\''
										 +' GROUP BY ts_aggregate';

		JMETERDB.transaction(  
			function (transaction) {  
				transaction.executeSql(queryRespTimes, [],  
					roSuccess, roError);  
			}  
		);

		function roSuccess(transaction, results) {
			var dataset=results.rows;
			var item;
			var dataArray_resp = [];
			var dataArray_tps_success = [];		
			var dataArray_tps_fail = [];	
			var objSeries_resp = {};
			var objSeries_tps_success = {};	
			var objSeries_tps_fail = {};		
			
			for (var x=0; x<results.rows.length; x++) {
				item = dataset.item(x);
				// Average resp times are a bit different, we need to find the weighted avg
				var total_count=item['success_count']+item['fail_count'];
				var weightedAvg=item['elapsed']/total_count;
				dataArray_resp.push([item['max_timestamp'],weightedAvg]);												
				dataArray_tps_success.push([item['max_timestamp'],item['success_tps']]);
				dataArray_tps_fail.push([item['max_timestamp'],item['fail_tps']]);												
			}
			objSeries_resp.name=item['current_label'];
			objSeries_resp.data=dataArray_resp;
			
			objSeries_tps_success.name=item['current_label'];
			objSeries_tps_success.data=dataArray_tps_success;
			
			objSeries_tps_fail.name=item['current_label'];
			objSeries_tps_fail.data=dataArray_tps_fail;
			
			switch(dest){
				case '_det':{
					respArray_resp.push(objSeries_resp);
					respArray_tps_success.push(objSeries_tps_success);
					respArray_tps_fail.push(objSeries_tps_fail);
					
					if (respArray_resp.length==countLables) {
						chartElapsedbyTrans = new Highcharts.Chart(lineRespTrans(respArray_resp, 'graphElapsedbyTrans', 'Transaction', "", 'milliseconds', "", '', "ms", true, dest));
					}
					if (respArray_tps_success.length==countLables) {
						chartTPSbyTrans_success = new Highcharts.Chart(lineRespTrans(respArray_tps_success, 'graphTPSbyTrans_success', 'Transaction', "", 'tps', "", '', "tps", true, dest));
					}
					if (respArray_tps_fail.length==countLables) {
						chartTPSbyTrans_fail = new Highcharts.Chart(lineRespTrans(respArray_tps_fail, 'graphTPSbyTrans_fail', 'Transaction', "", 'tps', "", '', "tps", true, dest));
					}
				}
				break;
				case '_cp0':{
					respArray0_resp.push(objSeries_resp);
					//respArray0_tps.push(objSeries_tps);
					if (respArray0_resp.length==countLables) {	
						chartElapsedbyTrans0 = new Highcharts.Chart(lineRespTrans(respArray0_resp, 'cpGraphElapsedbyTrans_cp0', 'Transaction', "", 'milliseconds', "", '', "ms", true, dest));
					}
					//if (respArray0_tps.length==countLables) {	
					//	chartTPSbyTrans0 = new Highcharts.Chart(lineRespTrans(respArray0_tps, 'cpGraphTPSbyTrans_cp0', 'Transaction', "", 'tps', "", '', "tps", true, dest));
					//}	
				}
				break;
				case '_cp1':{
					respArray1_resp.push(objSeries_resp);
					//respArray1_tps.push(objSeries_tps);
					if (respArray1_resp.length==countLables) {
						chartElapsedbyTrans1 = new Highcharts.Chart(lineRespTrans(respArray1_resp, 'cpGraphElapsedbyTrans_cp1', 'Transaction', "", 'milliseconds', "", '', "ms", true, dest));
						
						// We use this point as the probable point when all graphs have been built - this
						// is an approximation but it is difficult to log when all threads are complete.
						// TODO - move this to a more suitable localtion to fix rendering bug with graphs
						
						// Hide detail views
						$('#divCompRespBreakdown').slideUp();
						$('#divCompBytesBreakdown').slideUp();
						$('#divCompThroughputBreakdown').slideUp();
						
						// Remove overlay
						$('#overlay').hide();						
					}			
					//if (respArray1_tps.length==countLables) {
					//	chartTPSbyTrans1 = new Highcharts.Chart(lineRespTrans(respArray1_tps, 'cpGraphTPSbyTrans_cp1', 'Transaction', "", 'tps', "", '', "tps", true, dest));
					//}					
				}
				break;
				default:{
					console.log('roSuccess | Invalid dest value: '+dest)
				}
			}	
			return false;
		}

		function roError(){
			alert('roError')
		}
	}
}


function buildThroughputByCode(rctpsTestid, dest) {
		
	rctpsArray = [];	
	rctpsArray0=[];
	rctpsArray1=[];
	
	// Get a list of labels
	var queryResponseCodes =   				 ' SELECT '
											+' responsecode'
											+' FROM results '
											+' WHERE testid = '+rctpsTestid;
	
	queryResponseCodes=addQueryFilters(queryResponseCodes, dest);
	
	queryResponseCodes+=					' GROUP BY responsecode'+';';
																		
	//console.log('buildThroughputByCode: '+queryResponseCodes);
		
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(queryResponseCodes, [],  
				rctps1Success, rctps1Error);  
		}  
	);  

	function rctps1Success(transaction, results){ 
		
		//for each responsecode, query to get count and build an array 
		var dataset=results.rows;
		countResponsecode=results.rows.length;
		var item;
		
		for (var i=0; i<countResponsecode; i++) {
			item = dataset.item(i);
			getRespObject(rctpsTestid, item['responsecode'], dest);

		}// end for loop
	}
	function rctps1Error(transaction, error){
		alert(error.message);
	}
	
	function getRespObject(roTestid, roCode, dest) {
		
		var queryRespTimes = 			  ' SELECT MAX(timestamp) as max_timestamp,'
										 +' responsecode as code,'
										 //+' responsemessage as message,'
										 +' SUM(success_tps+fail_tps) as success_tps,'
										 +' SUM(fail_tps) as fail_tps'
										 +' FROM results'
										 +' WHERE testid ='+roTestid;
										
		queryRespTimes=addQueryFilters(queryRespTimes, dest);
								
		queryRespTimes+=				  ' AND responsecode = \''+roCode+'\''
										 +' GROUP BY ts_aggregate;';
										
		//console.log('queryRespTimes'+queryRespTimes);
										
		JMETERDB.transaction(  
			function (transaction) {  
				transaction.executeSql(queryRespTimes, [],  
					roSuccess, roError);  
			}  
		);

		function roSuccess(transaction, results) {
			var dataset=results.rows;
			var item;
			var dataArray = [];
			var objSeries = {};
			for (var x=0; x<results.rows.length; x++) {
				item = dataset.item(x);
				dataArray.push([item['max_timestamp'],item['success_tps']]);												
			}
			objSeries.name=item['code'];
			objSeries.data=dataArray;
			
			rctpsArray.push(objSeries);
			
			if (rctpsArray.length==countResponsecode) {
				// We have completed building the array and can now draw the graph
				chartElapsedbyTrans = new Highcharts.Chart(lineRespTrans(rctpsArray, 'graphThroughputbyCode', 'Code', "", 'count', "", '', "tps", true, dest));
				
				
				// This is, roughly, where processing ends for the graph build so we put a series of actions to perform once the page is fully built.
				
				// Hide the overlay
				$('#overlay').hide();
				
				// Enable clear cache button (now that the data *is* in the cache)
				$('#btnClearCache_selected').attr("disabled", false);
			}
			
			return false;
		}

		function roError(transaction, error){
			console.log(error.message);
		}
	}
}
	
// Global Vars
// Used in the updateSummaryLabels() function for building the comparison view.
var PREV_AVERAGE,
	PREV_BYTES,
	PREV_THROUGHPUT;
	
function updateSummaryLabels(duration, successCount, errorsPercentage, average, throughput, errorCount, bytes, dest) {
	var hours=duration.getHours(),
		minutes=duration.getMinutes(),
		seconds=duration.getSeconds();
	
	//console.log('In updateSummaryLabels, dest: '+dest+' compIndex: '+compIndex)	
		
	var totalCount=successCount+errorCount;
	var success_tps=successCount/duration*1000;
	var bytes_tps=bytes;
	
	switch(dest){
		case '_det':{
			var td1 = $('#tdSummary1'),
				td2 = $('#tdSummary2'),
				td3 = $('#tdSummary3'),
				td4 = $('#tdSummary4');

			// Write summay data to the screen	
			td1.text("Duration: "+hours+'h:'+minutes+'m:'+seconds+'s');
			td2.text('Avg. Response Time: '+average+'ms');
			td3.text('Tot. Reqs: '+totalCount+' (Errors: '+errorsPercentage+'%)');
			td4.text('Avg. Throughput.: '+success_tps.toFixed(3)+'per/s');
		}
		break;
		case '_cp0': {
			// First pass of 2
			// We have to record the values from this pass though this function using global vars
			// so that they can be used below in the second pass.
			PREV_AVERAGE=average;
			PREV_THROUGHPUT=success_tps;
			PREV_BYTES=bytes_tps;
		}
		break;
		case '_cp1': {
			// Last pass of two
			var labelAverageText = $('#cpResptimeText'),
				labelThroughputText=$('#cpThroughputText'),
				labelBytesText=$('#cpBytesText'),
				
				labelAveragePercentage = $('#cpResptimePercentage'),
				labelThroughputPercentage = $('#cpThroughputPercentage'),
				labelBytesPercentage = $('#cpBytesPercentage'),					
				percent, percent_colour, percent_sign;
			
			function updateComparisonLabels(percent, type){
				var decimels=0;
				// Set the sign (+ or minus)
				if(percent<0) {
					percent_sign=''; // '-' shows by default
				} else {
					percent_sign='+';
				}
			
				// Conditional colouring - we could extract these limits as properties...
				if (percent<=1) {
					percent_colour='green';
					decimels=3;
				} else if (percent<=10) {
					//console.log('<=10');
					percent_colour='green';
					decimels=2;
				} else if (percent <=20) {
					//console.log('<=20');
					percent_colour='orange';
					decimels=1;
				} else {
					//console.log('>20');
					percent_colour='red';
					decimels=0;
				}
				
				// Write the results to the page
				switch(type){
					case 'resptime' : {
						labelAverageText.text(PREV_AVERAGE+'ms vs. '+average+'ms');
						labelAveragePercentage.text(percent_sign+percent.toFixed(decimels)+'%');
						labelAveragePercentage.css({'color':percent_colour});
					}
					break;
					case 'throughput':{
						PREV_THROUGHPUT=parseFloat(PREV_THROUGHPUT).toFixed(2);
						success_tps=parseFloat(success_tps).toFixed(2);							
						labelThroughputText.text(PREV_THROUGHPUT+'tps vs. '+success_tps+'tps');
						labelThroughputPercentage.text(percent_sign+percent.toFixed(decimels)+'%');
						labelThroughputPercentage.css({'color':percent_colour});
					}
					break;
					case 'bytes':{
						PREV_BYTES=parseFloat(PREV_BYTES).toFixed(2);
						bytes_tps=parseFloat(bytes_tps).toFixed(2);							
						labelBytesText.text(PREV_BYTES+'b vs. '+bytes_tps+'b');
						labelBytesPercentage.text(percent_sign+percent.toFixed(decimels)+'%');
						labelBytesPercentage.css({'color':percent_colour});
					}
					break;
					default:{
						console.log('updateComparisonLabels default')
					}
				}
			}
			
			// Caculate percentage change
			resptimePercent=((average/PREV_AVERAGE)-1)*100;
			throughputPercent=((success_tps/PREV_THROUGHPUT)-1)*100;
			bytesPercent=((bytes_tps/PREV_BYTES)-1)*100;
			
			// Write results to screen
			updateComparisonLabels(resptimePercent, 'resptime');
			updateComparisonLabels(throughputPercent, 'throughput');
			updateComparisonLabels(bytesPercent, 'bytes');
			
			buildTransactionComparison(document.getElementById('inputTestid_cp0').value, document.getElementById('inputTestid_cp1').value);
		}
		break;
	}
}

function launchDetailView(testid, source) { // Called from table click or using URL params
	
	// Show overlay
	$('#overlay').show();
	
	// Set the toolbar text
	toolbarText_det='Test ID: '+testid;
	
	// Show results view
	containerVisibility('up','down','hide','hide');

	$('#toolbarText').text('Test ID: '+testid);

	if (source=='table') {
		// Remove any filters and zooms
		resetFilter('All', true);
		resetZoom(true); // Reset the co-ordinates but don't repaint the graphs
	} else if(source==='url'){
		// Call getBenchmarkStatus to set the labels with the ocrrect values 
		// This does not toggle the status
		getBenchmarkStatus(testid, true);
	}

	//checkIfResultsExist
	checkIfResultsExist(testid, '_det');
	
	// Add a menu item to link to the results view
	$("#ulNavbar li").remove('.liAppendedDet');
	$("#ulNavbar").append('<li class="liAppendedDet" id="liAnalysis"><a onclick="containerVisibility(\'hide\',\'show\',\'hide\',\'hide\')">DETAIL: [Test ID: '+testid+']</a></li>');
	$("#ulNavbar").append('<li class="divider-vertical liAppendedDet"></li>');

	
	// At the end of the funciton buildThroughputByCode() we have a series of actions that need to be performed at the end of the page build- such as showing the div
}

function checkIfResultsExist(chkTestid, dest){
	
	//console.log('in checkIfResultsExist with chkTestid: '+chkTestid+' compIndex: '+compIndex +' and dest: '+dest);
	// dest - destination. Where the graphs should be written to (detail or comparison)
	var query = 'SELECT testid, MAX(timestamp) as summaryMaxTimestamp, MIN(timestamp) as summaryMinTimestamp FROM results WHERE testid = '+chkTestid+';';
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(query, [],  
				successChkTestId, failChkTestId);  
		}  
	);

	function successChkTestId(transaction, results) {	
		
		var dataset=results.rows
		var item = dataset.item(0)
		if (item['testid']!=null) {
			// The data for this testid is already in local storage

			switch (dest){
				case '_det':{
					prepareDetailQueries(chkTestid);
				}
				break;
				case '_cp0':{
					buildComparisonView(chkTestid, dest);
				}
				break;
				case '_cp1':{
					buildComparisonView(chkTestid, dest);
				}
				break;
			}
		} else {
			// No values for this testid found so we have to make a call to get them remotely (regardless of whether or not clear cache was checked)
			//getErrorsData(chkTestid);
			getResultsData(chkTestid, dest);
		}		
	}
	function failChkTestId() {
		alert("failChkTestId");
	}
}

function buildFrequencyGraph(freqTestId, dest){  

	var queryMinMax =     			 ' SELECT '
									+' MAX(elapsed) as maxElapsed,'
									+' MIN(elapsed) as minElapsed'
									+' FROM results '
									+' WHERE testid = '+freqTestId;
	
	queryMinMax=addQueryFilters(queryMinMax, '_det');

	queryMinMax+=					' GROUP BY testid'
									+';';	
								
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(queryMinMax, [],  
				freqSuccess, freq1Error);  
		}  
	);  

	function freqSuccess(transaction, results){  
		var dataset=results.rows;
		if(!results.rows.length>0){
			console.log('freqSuccess | No data');
			return false;
		}
		var item = dataset.item(0);

		minRespTime=item['minElapsed'];
		maxRespTime=item['maxElapsed'];	
		range=maxRespTime+minRespTime;

		// Here we have the min and max response times - this gives us the range, now we need the data to loop over
		var queryRespTimes =     		 ' SELECT '
										+' elapsed as elapsed'
										+' FROM results WHERE testid = '+freqTestId;
										
		queryRespTimes=addQueryFilters(queryRespTimes, dest);
		
		//console.log('freqSuccess | queryRespTimes: '+queryRespTimes);
		
		JMETERDB.transaction(  
			function (transaction) {  
				transaction.executeSql(queryRespTimes, [],  
					freq2Success, freq2Error);  
			}  
		);

		function freq2Success(transaction, results) {

			var frequencyArray = [];
			var categoryArray = [];
			var markerArray = [];
			var seriesArray = [];
			var dataset=results.rows;
			var item;
			var marker;
			var columnCount = 12; // How many coloumns to use in the distrbution graph	
			var totalCount = 0; // Used to calculate the percentage
			var percentage = 0;

			//Adjust coloumncount
			columnCount++;	

			// Initialise the arrays - (because you can't add 1 to nothing)
			for (x=0; x<columnCount; x++) {
				frequencyArray[x]=0;
				markerArray[x]=x/(columnCount-1)*range;
			}

			// Loop though each elapsed value and count the frequency for each range
			for (var i=0; i<results.rows.length; i++) {
				item = dataset.item(i);
				// For each elapsed value check where it is on a scale and then increment the counter
				for (x=0; x<columnCount; x++) {
					if (item['elapsed']<markerArray[x]) {
						frequencyArray[x]++;
						totalCount++;
						break;
					}
				}
			}

			//Format from milliseconds to seconds
			for (x=0; x<columnCount; x++) {
				markerArray[x]=markerArray[x]/1000
			}

			// Now that we have the results, we build the Arrays to pass to the graphs
			for (x=1; x<columnCount; x++) {
				if (frequencyArray[x]>0) { 
					// Change the count to a percentage and push to the graph array
					
					// First, work out the percentage
					percentage=frequencyArray[x]/totalCount*100;
					
					// Then remove trailing decimels (which returns a string)
					sPercentage=percentage.toFixed(2);
					
					// Cast the string from toFixed back to a float, but now with a neater count of decimel places.
					fPercentage=parseFloat(sPercentage);
					
					// Put it in the array
					seriesArray.push(fPercentage);
					
					} else { // Enter zeros where no results were matched (prevents undefined errors)
						seriesArray.push(0);
					}
					if (x==columnCount-1) {
						// Then it's the last column so don't append the less than
						categoryArray.push('>'+markerArray[x-1].toFixed(2));
					} else {
						categoryArray.push(markerArray[x-1].toFixed(2)+' to '+markerArray[x].toFixed(2));
					}
				}
												
				// Here we build the highcharts graph using the query results and put it in the given div
				switch(dest){
					case '_det':{
						chartDistribution = new Highcharts.Chart(barDistribution(seriesArray, categoryArray, 'graphDistribution', '', '%', 'Seconds', true, dest));
					}
					break;
					case '_cp0':{
						chartDistribution = new Highcharts.Chart(barDistribution(seriesArray, categoryArray, 'cpGraphDistribution'+dest, '', '%', 'Seconds', false, dest));			
					}
					break;
					case '_cp1':{
						chartDistribution = new Highcharts.Chart(barDistribution(seriesArray, categoryArray, 'cpGraphDistribution'+dest, '', '%', 'Seconds', false, dest));									
					}
					break;
					default:{
						console.log('freq2Success | Invalid dest value: '+dest)
					}
				}
			}

		function freq2Error(){
			alert('freq2Error')
		}

	}
	function freq1Error(){
		alert('freq1Error');
	}
}

function buildAggregateTable(aggTestId, dest){  
	
	v90thArray=[];
	aggCount=0;
	
	//Using testid, we select the results from the local database
	var queryAggregate =     ' SELECT'
							+' label as label,'
							+' MIN(timestamp) as min_timestamp,' 							
							+' MAX(timestamp) as max_timestamp,' 							
							+' MAX(ts_aggregate) as ts_aggregate,' 							// Used to get interval
							+' SUM(success_count+fail_count) as total_count,' 				// No of Samples
							+' SUM(elapsed * (success_count + fail_count)) as sum_elapsed, '
							+' MIN(min_elapsed) as min_elapsed,'							// Min
							+' MAX(max_elapsed) as max_elapsed,'							// Max
							+' SUM(fail_count) as fail_count,'								// Error Count - need to calculate percentage using total_count
							+' AVG(success_tps) as success_tps,'           					 // Throughput
							+' AVG(bytes_tps) as bytes_tps'									// Bytes - need to divide by duration to get bytes/sec
							+' FROM results '
							+' WHERE testid ='+aggTestId;
							
	queryAggregate=addQueryFilters(queryAggregate, dest);
	
	queryAggregate+=		 ' GROUP BY label;';

	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(queryAggregate, [],  
				dataSelectHandler, errorHandler);  
		}  
	);  
	
	//console.log('buildAggregateTable | queryAggregate: '+queryAggregate);

	function dataSelectHandler(transaction, results){ 

		var vLabel;
		var vTotal_count;
		var vTimestamp;
		var vAggregate;
		var vAverage_elapsed;
		var vMin_elapsed;
		var vMax_elapsed;
		var vFail_count;
		var vSuccess_tps;
		var vBytes;

		var vError_rate;

		var vTotTotal_count=0;
		var vTotAverage_elapsed=0;
		var vTotMin_elapsed=99999999;
		var vTotMax_elapsed=-1;
		var vTotError_rate=0;
		var vTotSuccess_tps=0;
		var vTotBytes=0;

		var vHtml;

		var dataset=results.rows;
		var item;
		
		aggCount=results.rows.length;
		for (var i=0; i<aggCount; i++) {
			item = dataset.item(i);
			
			vLabel=item['label'];
			vTotal_count=item['total_count'];
			vTimestamp=item['max_timestamp'];
			vAggregate=item['ts_aggregate'];
			vAverage_elapsed=item['sum_elapsed']/vTotal_count;
			vMin_elapsed=item['min_elapsed'];
			vMax_elapsed=item['max_elapsed'];
			vFail_count=item['fail_count'];
			vSuccess_tps=vTotal_count/(item['max_timestamp']-item['min_timestamp'])*1000;
			vBytes=item['bytes_tps']/1024;

			vError_rate=(vFail_count/vTotal_count*100);

			// Create one aggregate row per transaction
			vHtml+="<tr onclick=\"clickAggregateTable(this, \'_det\')\">";
			// If a filter is active then check the checkboxes
			if(whereTransaction){
				vHtml+='<td><input type="checkbox" onclick="this.checked=!this.checked;" id="chkAgg'+i+'"class="chcktbl" checked/></td>';
			} else {
				vHtml+='<td><input type="checkbox" onclick="this.checked=!this.checked;" id="chkAgg'+i+'"class="chcktbl" /></td>';
			}
			vHtml+='<td>'+vLabel+'</td>';
			vHtml+='<td>'+vTotal_count+'</td>';
			vHtml+='<td>'+vAverage_elapsed.toFixed(0)+'ms</td>';
			vHtml+='<td id="td90th'+i+'">90th</td>';
			vHtml+='<td>std</td>';
			vHtml+='<td>'+vMin_elapsed+'ms</td>';
			vHtml+='<td>'+vMax_elapsed+'ms</td>';
			vHtml+='<td>'+vError_rate.toFixed(3)+'%</td>';
			vHtml+='<td>'+vSuccess_tps.toFixed(3)+'/sec</td>';
			vHtml+='<td>'+vBytes.toFixed(2)+' Kb/sec</td>';
			vHtml+='</tr>';
			
			//vTotLabel;
			vTotTotal_count += vTotal_count;
			vTotAverage_elapsed += vAverage_elapsed;
			if (vMax_elapsed > vTotMax_elapsed) {vTotMax_elapsed=vMax_elapsed};
			if (vMin_elapsed < vTotMin_elapsed) {vTotMin_elapsed=vMin_elapsed};
			vTotError_rate += vError_rate;
			vTotSuccess_tps += vSuccess_tps;
			vTotBytes += vBytes;
		}

		// Create a total row
		vTotAverage_elapsed = vTotAverage_elapsed/results.rows.length; // Create an average of the average
		vTotError_rate = vTotError_rate/results.rows.length;  // Create an average of the average

		vHtml+='<td></td>';
		vHtml+='<td>Totals:</td>';
		vHtml+='<td>'+vTotTotal_count+'</td>';
		vHtml+='<td>'+vTotAverage_elapsed.toFixed(0)+'ms</td>';
		vHtml+='<td>'+'No data'+'ms</td>';
		vHtml+='<td>'+'No data'+'ms</td>';
		vHtml+='<td>'+vTotMin_elapsed+'ms</td>';
		vHtml+='<td>'+vTotMax_elapsed+'ms</td>';
		vHtml+='<td>'+vTotError_rate.toFixed(3)+'%</td>';
		vHtml+='<td>'+vTotSuccess_tps.toFixed(3)+'/sec</td>';
		vHtml+='<td>'+vTotBytes.toFixed(2)+' Kb/sec</td>';
		vHtml+='</tr>';
		
		
		// Write the table out to html
		$('#bodyAggregate_det').html(vHtml);
		
		// For each table row, calculate the 90th percentile and stddev. values
		calculateStats(aggTestId, dest);
	}

	function errorHandler(){
		alert('Agg Problem')
	}
	
	function calculateStats(statsTestid){
		
		JMETERDB.transaction(  
			function (transaction) {
				
				// Might switch here later if we use this for the comp view
				var tableId='bodyAggregate_det'
		
				$('#'+tableId+' tr')
			  	.children("td:nth-child(2)")
				.each(function(index) { 
					queryStats=			 ' SELECT'
									    +' elapsed,'
										
					if($(this).text()=="Totals:") {
						queryStats+=	 ' bytes,'   // We include bytes as a marker so we know when we have reached the last row in the table
					}			
									
					queryStats+=		 ' label'
										+' FROM results '
										+' WHERE testid ='+statsTestid;
										
					queryStats=addQueryFilters(queryStats, dest);
					
					if($(this).text()!="Totals:") { // Not for the totals row
						queryStats+=	 ' AND label = \''+$(this).text()+'\';'
					}

					transaction.executeSql(queryStats, [], queryStatsSuccess, queryStatsError);
					
					function queryStatsSuccess(transaction, results){ 

						var dataset=results.rows;
						var item;
						var values = []; // Main Array
						var avgValues = 0; // Working value for STD DEV
						var sumValues = 0; // Working value for STD DEV
						var stdDev_working = []; // Sub Array for STD DEV
						var stdDevVal = 0; // Final result for STD DEV
						var sumStdDev = 0; // Working value for STD DEV
						var avgStdDev = 0; // Working value for STD DEV

						//console.log('queryStatsSuccess | results length: '+results.rows.length)
						if (!results.rows.length>0){
							return false
						}

						function numAsc(a, b){ return (a-b); } // Sort method

						// Calculate the 90th position
						var ninetyth = parseInt(results.rows.length * 90/100);
						//console.log('ninetyth: '+ninetyth);

						// Populate the Main array
						for (var i=0; i<results.rows.length; i++) {
							item = dataset.item(i);
							values[i]=item['elapsed'];
							sumValues+=item['elapsed']; // Used for STD DEV
						}

						// Calculate the simple average - STD DEV
						avgValues=sumValues/results.rows.length;

						// STD DEV workings
						for (var i=0; i<results.rows.length; i++) {
							item = dataset.item(i);
							stdDev_working[i]=item['elapsed']-avgValues; // Subtract the MEAN
							stdDev_working[i]=stdDev_working[i]*stdDev_working[i]; // Square the result
							sumStdDev+=stdDev_working[i];
						}

						// Calculate the deviation average - STD DEV
						avgStdDev=sumStdDev/results.rows.length;

						// Get the square root of the average - STD DEV
						stdDevVal=Math.sqrt(avgStdDev).toFixed(0); //This is the final standard deviation

						// Sort the array
						values.sort(numAsc);

						// Pull out the 90th Percentile
						percentileVal=values[ninetyth-1];

						if (item['bytes']==undefined) { // Standard row

							// Clunky table traverse
							var table = document.getElementById(tableId);
							for (var i=0; i<table.rows.length; i++) { 
								var cellLabel = table.rows[i].cells[1];
								if (cellLabel.firstChild.data==item['label']) {
									// 90th percentile
									var cellPercentile = table.rows[i].cells[4];
									cellPercentile.innerText = percentileVal+'ms';
									// Standard Deviation
									var cellStdDev = table.rows[i].cells[5];
									cellStdDev.innerText = stdDevVal+'ms';
								}
							} 
						} else { // Last row, no need to traverse
							var table = document.getElementById(tableId);
							var countRows=table.rows.length;
							//console.log(countRows)
							table.rows[countRows-1].cells[4].innerText = percentileVal+'ms';
							table.rows[countRows-1].cells[5].innerText = stdDevVal+'ms';				
						}

						return false;
					}
				});
			}  
		);	

		function queryStatsError() {
			console.log('queryStatsError');
		}											
	}
}

function buildTransactionComparison(testidBefore, testidAfter) {
	var prev_average=[], prev_categories=[], prev_success=[], prev_fail=[],  prev_bytes=[],
		queryTransBreakdown='';
	
	queryTransBreakdown = 'SELECT'
	+' label,'
	+' SUM(success_count+fail_count) as total_count,' 						// No of Samples
	+' SUM(elapsed * (success_count + fail_count)) as sum_elapsed,'			// Sum - later divided by count	
	+' MIN(timestamp) as min_timestamp,'
	+' MAX(timestamp) as max_timestamp,'
	+' SUM(success_count) as success_count,'
	+' AVG(bytes_tps) as bytes_tps,'
	+' SUM(fail_count) as fail_count'
	+' FROM results'
	+' WHERE testid ='+testidBefore;
	queryTransBreakdown=addQueryFilters(queryTransBreakdown, '_cp0');
	queryTransBreakdown+=' GROUP BY label';

	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(queryTransBreakdown, [],  
				successFirstPass, errorFirstPass);  
		}  
	);  

	function successFirstPass(transaction, results){  
		var elapsed_avg, total_count, success_tps, success_count, bytes,
			dataset=results.rows,
			item;
		
		for (var i=0; i<results.rows.length; i++) {
			item = dataset.item(i);

			total_count=item['total_count'];
			success_count=item['success_count'];
			elapsed_avg=item['sum_elapsed']/total_count;
			success_tps=success_count/(item['max_timestamp']-item['min_timestamp'])*1000;
			

			// First pass of 2 so just write the results to the arrays
			prev_average[i]=elapsed_avg;
			prev_success[i]=success_tps;
			//prev_fail[i]=item['fail_count'];
			prev_categories[i]=item['label'];
			prev_bytes[i]=item['bytes_tps'];
		}
		
		// Begin 2nd pass
		queryTransBreakdown = 'SELECT'
		+' label,'
		+' SUM(success_count+fail_count) as total_count,' 						// No of Samples
		+' SUM(elapsed * (success_count + fail_count)) as sum_elapsed,'			// Sum - later divided by count	
		+' MIN(timestamp) as min_timestamp,'
		+' MAX(timestamp) as max_timestamp,'
		+' SUM(success_count) as success_count,'
		+' AVG(bytes_tps) as bytes_tps,'
		+' SUM(fail_count) as fail_count'
		+' FROM results'
		+' WHERE testid ='+testidAfter;
		queryTransBreakdown=addQueryFilters(queryTransBreakdown, '_cp1');
		queryTransBreakdown+=' GROUP BY label';
			
		JMETERDB.transaction(  
			function (transaction) {  
				transaction.executeSql(queryTransBreakdown, [],  
					successSecondPass, errorSecondPass);  
			}  
		);
		
		function successSecondPass(transaction, results){  
			
			// Last pass of two
			dataset=results.rows;
			var arrRespTimes=[], arrThroughput=[], categoryArray=[], arrBytes=[];
			
			for (i=0; i<results.rows.length; i++) {
				item = dataset.item(i);

				total_count=item['total_count'];
				success_count=item['success_count'];				
				elapsed_avg=item['sum_elapsed']/total_count;
				success_tps=success_count/(item['max_timestamp']-item['min_timestamp'])*1000;
				bytes=item['bytes_tps'];

				function addPercentToArray(theArray, percent) {
					var	percent_colour;
					// Conditional colouring - we could extract these limits as properties...
					if (percent<=1) {
						//console.log('<=1');
						percent_colour='green';
						percent=parseFloat(percent.toFixed(3));
						theArray.push({ y: percent, color: 'green' });
					} else if (percent<=10) {
						//console.log('<=10');
						percent_colour='green';
						percent=parseFloat(percent.toFixed(2));
						theArray.push({ y: percent, color: 'green' });
					} else if (percent <=20) {
						//console.log('<=20');
						percent_colour='orange';
						percent=parseFloat(percent.toFixed(1));
						theArray.push({ y: percent, color: 'orange' });
					} else {
						//console.log('>20');
						percent_colour='red';
						percent=parseFloat(percent.toFixed(0));
						theArray.push({ y: percent, color: 'red' });
					}
				}
				
				// Caculate percentage changes
				percentRespTime=((elapsed_avg/prev_average[i])-1)*100;
				//console.log('elapsed before: '+prev_average[i]+' now: '+elapsed_avg+' = '+percentRespTime)
				percentThroughput=((success_tps/prev_success[i])-1)*100;
				percentBytes=((bytes/prev_bytes[i])-1)*100;
				
				//Push to arrays
				addPercentToArray(arrRespTimes, percentRespTime);
				addPercentToArray(arrThroughput, percentThroughput);
				addPercentToArray(arrBytes, percentBytes);
				categoryArray.push(item['label']);
			}
			
			// Here we build the highcharts graph using the query results and put it in the given div
			chartCompElapsedBreakdown= new Highcharts.Chart(barCompBreakdown(arrRespTimes, categoryArray, 'cpRespTimeBreakdown', '', 'Change(%)', true));
			chartCompThroughputBreakdown= new Highcharts.Chart(barCompBreakdown(arrThroughput, categoryArray, 'cpThroughputBreakdown', '', 'Change(%)', true));
			chartCompBytesBreakdown= new Highcharts.Chart(barCompBreakdown(arrBytes, categoryArray, 'cpBytesBreakdown', '', 'Change(%)', true));
		}
		
		function errorSecondPass(){
			alert('errorSecondPass')
		}			
	}

	function errorFirstPass(){
		alert("errorBuildTransactionComparison");
	}
}


function queryOverallResults(ovrTestId, dest){ 	
	
	//Using testid, we select the results from the local database
	var queryOverall =   ' SELECT'
						+' SUM(success_count+fail_count) as total_count,' // No of Samples
						+' MIN(elapsed) as min_elapsed,'					// Min
						+' MAX(elapsed) as max_elapsed,'					// Max
						+' SUM(success_count) as success_count,'
						+' SUM(fail_count) as fail_count,'          					 // Throughput
						+' AVG(bytes_tps) as bytes_tps,'
						+' COUNT(label) as count_label,'
						+' SUM(elapsed * (success_count + fail_count)) as sum_elapsed,'					// Sum - later divided by count
						+' MIN(timestamp) as min_timestamp,'				// Min timestamp
						+' MAX(timestamp) as max_timestamp,'				// Max timestamp
						+' SUM(fail_count) as fail_count'					// Error Count - need to calculate percentage using total_count
						+' FROM results '
						+' WHERE testid ='+ovrTestId
	
	queryOverall=addQueryFilters(queryOverall, dest);

	//console.log('queryOverall: '+queryOverall);
	
	JMETERDB.transaction(  
		function (transaction) {  
			transaction.executeSql(queryOverall, [],  
				dataSelectHandler, errorHandler);  
		}  
	);  

	function dataSelectHandler(transaction, results){  

		// We should only have one record in the resultset
		var dataset=results.rows;
		var item = dataset.item(0);

		var total_count=item['total_count'],
			error_count=item['fail_count'],
			success_count=item['success_count'],
			errPercentage=error_count/total_count*100,
			elapsed_avg=item['sum_elapsed']/total_count,
			bytes=item['bytes_tps'];
		
		var duration=item['max_timestamp']-item['min_timestamp'],
			tps_avg=total_count/(duration/1000)	,
			startDate=new Date(item['min_timestamp']),
			endDate=new Date(item['max_timestamp']),
			durationDate=new Date;
		
		durationDate.setTime(endDate-startDate);

		updateSummaryLabels(durationDate, success_count, errPercentage.toFixed(2), elapsed_avg.toFixed(0), tps_avg.toFixed(3), error_count, bytes, dest);
	}


	function errorHandler(transaction, error){
		console.log('queryOverallResults | Error: '+error.message);
	}
}


function getResultsData(testid, dest) { // Called when the selected testid is not in local storage
	var sDbname=cDBNAME//localStorage.getItem("config_dbname");
	var sDbpass=cDBPASS//localStorage.getItem("config_dbpass");	
	var sDbuser=cDBUSER//localStorage.getItem("config_dbuser");
	var sDbhost=cDBHOST//localStorage.getItem("config_dbhost");
	var sRecordcount=$('#inputRecordCount').val();
	var postParams = 'testid='+testid+'&recordCount='+sRecordcount+'&dbname='+sDbname+'&dbpass='+sDbpass+'&dbuser='+sDbuser+'&dbhost='+sDbhost;
		
	var postURL = 'php/get-results.php';

	$.post(postURL, postParams, importResults, "text");
	var insertSuccess_x=0; //Awful way to check when inserts re done
	var importResults_count;

	function importResults(rows)
	{
		// here we need to import the data to sqlite
		//This requires parsing the json response from our php script
		var obj = JSON.parse(rows);

		importResults_count = obj.results.length; // This needs to be global for that godawful way I'm checking the insert further below (x)
		
		if(importResults_count===0){
			// Hide overlay
			$('#overlay').hide();
			containerVisibility('hide','hide','show','hide');
			showAlert('There were no records in the database for that test! Please try using a different database.','error');
			$('#graphSummary').css("background-image", "");
			return false;
		}

		//Now we loop through the obj and call insert for each row
		JMETERDB.transaction( 
			function (transaction) { 
				for(i=0; i<obj.results.length; i++) {
					// Calculate TPS values
					var interval=obj.results[i].timestamp/obj.results[i].ts_aggregate/1000;

					var success_tps=obj.results[i].success_count/interval;
					var fail_tps=obj.results[i].fail_count/interval;
					success_tps=success_tps.toFixed(3);
					fail_tps=fail_tps.toFixed(3);

					var bytes_tps=obj.results[i].bytes/interval;

					// Insert statement
					transaction.executeSql("INSERT INTO results(testid,timestamp,ts_aggregate,elapsed,min_elapsed,max_elapsed,responsecode,label,success_count,success_tps,fail_count,fail_tps,bytes,bytes_tps,grpthreads,allthreads,latency,hostname) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
					[obj.results[i].testid, 
					obj.results[i].timestamp, 
					obj.results[i].ts_aggregate, 
					obj.results[i].elapsed, 
					obj.results[i].min_elapsed, 
					obj.results[i].max_elapsed, 
					obj.results[i].responsecode,
					obj.results[i].label, 
					obj.results[i].success_count, 
					success_tps, 
					obj.results[i].fail_count, 
					fail_tps, 
					obj.results[i].bytes, 
					bytes_tps, 
					obj.results[i].grpthreads, 
					obj.results[i].allthreads, 
					obj.results[i].latency, 
					obj.results[i].hostname
					], insertSuccess, insertError);  	
				}  
			}
		);	
	}

	function insertSuccess() {
		// We end up here after every individual insert so check which record we're on to decide if we build the graph or not.
		insertSuccess_x++;
		if (insertSuccess_x==importResults_count-1) {
			// OK, so now we are ready to build the graphs.			
			
			// Update tests table for any changes in the cache
			checkLocalCache();
			
			// Build the analysis view
			switch (dest){
				case '_det':{
					prepareDetailQueries(testid);
				}
				break;
				case '_cp0':{
					buildComparisonView(testid, dest);
				}
				break;
				case '_cp1':{
					buildComparisonView(testid, dest);
				}
				break
			}
		}
	}

	function insertError(transaction, error) {
		insertSuccess_x++;
		console.log('importResults | Insert error: '+error.message);
		// We end up here on duplicate insert error.
	}
}

function dropAllTables() {
	// Drop the results table - something of a dev function
	bootbox.confirm("Drop all tables from the local Web SQL Database?", "Cancel", "Delete", function(result) {
	    if (result) {
			JMETERDB.transaction( 
				function (transaction) { 
					//transaction.executeSql("DROP TABLE errors;", [], successCountclearCache, failCountclearCache);
					transaction.executeSql("DROP TABLE results;", [], sdropAllTables, fdropAllTables);
				}
			);
	
			function sdropAllTables(transaction){
				createResultsTable();
				// Update the cache count shown on the config form
				getConfig();
				
				// Remove any links from the nav bar
				$("#ulNavbar li").remove('.liAppendedDet');
				$("#ulNavbar li").remove('.liAppendedComp');
				
				showAlert('All tables dropped.','info');
			}
	
			function fdropAllTables(transaction, error){
				console.log('fdropAllTables: '+error.message);
			}
		}
	});
}


function clearCache(cchTestid, suppressMessages){
	
	JMETERDB.transaction( 
		function (transaction) { 
			transaction.executeSql("SELECT testid from results GROUP BY testid;", [], successCountclearCache);
		}
	);
	
	function successCountclearCache(transaction, results) {
		var dataset=results.rows;
		if(results.rows.length>0){	
			
			if(cchTestid){
				var sMessage = "Are you sure you want to remove this test from the local cache?<br/><br/>Test ID: "+cchTestid
				var clearCacheSQL= "DELETE FROM results WHERE testid ="+cchTestid;
			} else {
				var sMessage = "Remove "+results.rows.length+" tests from the local cache?";
				var clearCacheSQL= "DELETE FROM results WHERE testid is not null";		
			}
			
			if(suppressMessages){
				runClearCache(cchTestid, sMessage, clearCacheSQL);
			} else {
				bootbox.confirm(sMessage, "Cancel", "Delete", function(result) {
				    if (result) {
						runClearCache(cchTestid, sMessage, clearCacheSQL);
					}
				});	
			}
			        
			function runClearCache(cchTestid, sMessage, clearCacheSQL){
				JMETERDB.transaction( 
					function (transaction) { 
						transaction.executeSql(clearCacheSQL, [], successClearCache, failClearCache);
					}
				);
			
				function successClearCache() {
					if(cchTestid){
						// Change the indicator in the table for the selected test
						$.each(objDataTable_det.fnGetNodes(), function(index, value) {
						     if($(value).find("td").eq(0).text()===cchTestid){
								$(value).find("td").eq(1).text('N');
							}
						});
					
						// Remove navbar links if they reference the testid that we're clearing from the cache
						if($('.liAppendedDet :contains("Test ID: '+cchTestid+'")').length>0){
							$("#ulNavbar li").remove('.liAppendedDet');
						}
						if($('.liAppendedComp :contains("Test ID '+cchTestid+'")').length>0){
							$("#ulNavbar li").remove('.liAppendedComp');
						}
					} else {
						// Change all the indicators in the table
						$.each(objDataTable_det.fnGetNodes(), function(index, value) {
							$(value).find("td").eq(1).text('N');
						});
					
						// Remove any links from the nav bar
						$("#ulNavbar li").remove('.liAppendedDet');
						$("#ulNavbar li").remove('.liAppendedComp');
					}
					// Disable the clear selected cache button
					$('#btnClearCache_selected').attr("disabled", true);
				
					// Update the cache count shown on the config form
					getConfig();
				}
	
				function failClearCache(transaction, error) {
					console.log('clearCache | failClearCache | Error: '+error.message);
				}
			}		
			

		} else {
			if(!suppressMessages){
				bootbox.alert('There are no items in the cache to clear');
			}
		}
	}
	
	function failCountclearCache(transaction, error) {
		console.log('clearCache | failCountclearCache | Error: '+error.message);
	}
}

function deleteTest(delTestid){
	var sMessage = "Are you sure you want to delete this test? This action is irreversible.<br/><br/>Test ID: "+delTestid
	bootbox.confirm(sMessage, function(result) {
	    if (result) {
	        deleteTest_ajax(delTestid);
	    }
	});
	
	function deleteTest_ajax(delTestid){
		var sDbname=cDBNAME//localStorage.getItem("config_dbname");
		var sDbpass=cDBPASS//localStorage.getItem("config_dbpass");	
		var sDbuser=cDBUSER//localStorage.getItem("config_dbuser");
		var sDbhost=cDBHOST//localStorage.getItem("config_dbhost");
		
		var postParams = 'testid='+delTestid+'&dbname='+sDbname+'&dbpass='+sDbpass+'&dbuser='+sDbuser+'&dbhost='+sDbhost;
		
		var postURL = 'php/delete-test.php';
		
		$.post(postURL, postParams, deleteResults, "text");

		function deleteResults(result) {
			if(result===delTestid){
				deleteTest_local(delTestid);
				clearCache(delTestid, true); // suppressMessages = true
			}
		}
		
		function deleteTest_local(delTestid){
			$.each(objDataTable_det.fnGetNodes(), function(index, value) {
			     if($(value).find("td").eq(0).text()===delTestid){
					// Found
					objDataTable_det.fnDeleteRow(index);
				}
			});
		}
	}
}

function purgeLocalstorage(){
	bootbox.confirm("Delete all data from LocalStorage?", "Cancel", "Delete", function(result) {
	    if (result) {
			localStorage.clear();
			getConfig();
		}
	});
}

// ====================== Highcharts ========================

function lineSingle (pointsArray, container, title, label_y, label_x, series_name, measurement, fireEvents, dest) {
	var options = {
		chart: {
			renderTo: container,
			zoomType: 'x',
			spacingRight: 20,
			events: {
				selection: function(event) {
					if(fireEvents) {
						var min, max;
						if (event.xAxis) {
							selectionObj=event.xAxis[0];
							min = selectionObj.min;
							max = selectionObj.max;
						} else {
							selectionObj = this.xAxis[0].getExtremes();
							min = selectionObj.dataMin;
							max = selectionObj.dataMax;
						};

						switch(dest){
							case '_cp0':{
								min_cp0=min;
								max_cp0=max;
								buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
							}
							break;
							case '_cp1':{
								min_cp1=min;
								max_cp1=max;
								buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
							}
							break;
							case '_det':{
								min_det=min;
								max_det=max;
								prepareDetailQueries(document.getElementById('inputTestid_det').value);
							}
							break;
							default:{

							}
						}
						zoomStatus(true);					
					} else {
						event.preventDefault();
					}
				}
			}
		},
		credits: {
			enabled: false
		},
		title: {
			text: title
		},	
		legend: {
			enabled: false
		},
		xAxis: {
			type: 'datetime',
			title: {
				text: label_x
			}
		},
		yAxis: {
			title: {
				text: label_y
			},
			min: 0,
			startOnTick: false,
			showFirstLabel: false
		},
		tooltip: {
			formatter: function() {
				return '<b>'+ this.series.name +'</b><br/>'+
				Highcharts.dateFormat('%e. %b, %Hh:%Mm', this.x) +' | '+ this.y.toFixed(0) +' '+measurement;
			}
		},
		plotOptions: {
			area: {
				fillColor: {
					linearGradient: [0, 0, 0, 175],
					stops: [
					[0, Highcharts.getOptions().colors[0]],
					[1, 'rgba(2,0,0,0)']
					]
				},
				lineWidth: 1,
				marker: {
					enabled: false,
					states: {
						hover: {
							enabled: true,
							radius: 5
						}
					}
				},
				shadow: false,
				states: {
					hover: {
						lineWidth: 1
					}
				}
			}
		},


		series: [{
			type: 'area',
			name: series_name,
			data: pointsArray
			}]
		};
	return options;
}

function lineDouble (pointsArray1, pointsArray2, container, title, label_y, label_x, series_name1, series_name2, subTitle, fireEvents, dest) {
	var options = {
		chart: {
			renderTo: container,
			zoomType: 'x',
			spacingRight: 20,
			events: {
				selection: function(event) {
					if(fireEvents) {
						var min, max;
						if (event.xAxis) {
							selectionObj=event.xAxis[0];
							min = selectionObj.min;
							max = selectionObj.max;
						} else {
							selectionObj = this.xAxis[0].getExtremes();
							min = selectionObj.dataMin;
							max = selectionObj.dataMax;
						};
						
						switch(dest){
							case '_cp0':{
								min_cp0=min;
								max_cp0=max;
								buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
							}
							break;
							case '_cp1':{
								min_cp1=min;
								max_cp1=max;
								buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
							}
							break;
							case '_det':{
								min_det=min;
								max_det=max;
								prepareDetailQueries(document.getElementById('inputTestid_det').value);
							}
							break;
							default:{
								console.log('lineDouble | Default');
							}
						}
						zoomStatus(true);				
					} else {
						event.preventDefault();
					}
				}
			}
		},
		credits: {
			enabled: false
		},
		title: {
			text: title
		},
		subtitle: {
			text: subTitle
		},	
		legend: {
			enabled: false
		},
		xAxis: {
			type: 'datetime',
			title: {
				text: label_x
			}
		},
		yAxis: {
			title: {
				text: label_y
			},
			min: 0,
			startOnTick: false,
			showFirstLabel: false
		},
		tooltip: {
			formatter: function() {
				return '<b>'+ this.series.name +'</b><br/>'+
				Highcharts.dateFormat('%e. %b, %Hh:%Mm:%Ss', this.x) +' | '+ this.y.toFixed(3) +' tps';
			}
		},
		plotOptions: {
			area: {
				fillColor: {
					linearGradient: [0, 0, 0, 175],
					stops: [
					[0, Highcharts.getOptions().colors[0]],
					[1, 'rgba(2,0,0,0)']
					]
				},
				lineWidth: 1,
				marker: {
					enabled: false,
					states: {
						hover: {
							enabled: true,
							radius: 5
						}
					}
				},
				shadow: false,
				states: {
					hover: {
						lineWidth: 1
					}
				}
			}
		},

		series: [{
			type: 'area',
			name: series_name1,
			data: pointsArray1
		}	, {
			name: series_name2,
			color: '#FF0000',
			type: 'line',
			data: pointsArray2
			}]
		};
	return options;
}

function barPassFail (dataPass, dataFail, categories, container, type, label_y, fireEvents, dest) {
	var options = {
		chart: {
			renderTo: container,
			type: 'bar'
		},
		credits: {
			enabled: false
		},
		title: {
			text: ''
		},	
		legend: {
			enabled: false
		},
		xAxis: {
			categories: categories,
			labels: {
				rotation: 0,
				align: 'right',
				style: {
					fontSize:'10px',
					fontWeight: 'bold'
				}
			}
		},	
		yAxis: {
			min: 0,
			title: {
				text: label_y
			}
		},
		tooltip: {
			formatter: function() {
				return ''+
				this.series.name +' ('+ Math.round(this.percentage) +'%): '+ this.y;
			}
		},
		plotOptions: {
			bar: {
				stacking: 'percent'
			},
			series: {
				point:{
					events: {
						click: function(event) {
							if(fireEvents) {
								switch(dest){
									case '_cp0':{
										setWhereClause(type, this.category, '_cp0');
										buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
									}
									break;
									case '_cp1':{
										setWhereClause(type, this.category, '_cp1');
										buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
									}
									break;
									case '_det':{
										setWhereClause(type, this.category, '_det');
										prepareDetailQueries(document.getElementById('inputTestid_det').value);
									}
									break;
									default:{
										console.log('barPassFail | Invalid dest: '+dest)
									}
								}
							} else {
								event.preventDefault();
							}
						}
					}
				}
			}
		},
		series: [{
			name: 'Pass',
			data: dataPass,
			color: { linearGradient: [0, 0, 0, 350],
				stops: [
				[0, 'rgb(180,255,180)'], //60,179,113
				[1, 'rgb(34,139,34)'] //14, 119, 14
				]
			},
			dataLabels: {
				enabled: true,
				style: {
					fontSize:'8pt',
					color: 'white'
				},
				y: 12,
				formatter: function() {
					return ''+
					this.series.name +': ' + this.y;
				}
			}
		}, {
			name: 'Fail',
			data: dataFail,
			color: { linearGradient: [0, 0, 0, 350],
				stops: [
				[0, 'rgb(255, 255, 255)'],
				[1, 'rgb(205, 5, 5)']
				]
			},
			dataLabels: {
				enabled: true,
				style: {
					fontSize:'8pt',
					color: 'white'
				},
				y: 0	,
				formatter: function() {
					return ''+
					this.series.name +': ' + this.y;
				}
			}
			}]
		};
	return options;
}

function barDistribution (pointsArray, categories, container, title, label_y, label_x, fireEvents, dest) {
	var options = {
		chart: {
			renderTo: container,
			type: 'column'
		},
		credits: {
			enabled: false
		},
		title: {
			text: title
		},	
		legend: {
			enabled: false
		},
		xAxis: {
			categories: categories,
			title: {
				text: label_x
			},
            labels: {
                rotation: -45,
				align: 'right'
            }
		},
		yAxis: {
			min: 0,
			max: 100,
			title: {
				text: label_y
			}
		},
		tooltip: {
			formatter: function() {
				return ''+
				this.x +' : '+ this.y +'%';
			}
		},
		plotOptions: {
			bar: {
				dataLabels: {
					enabled: true
				}
			},
			series: {
				point:{
					events: {
						click: function(event) {
							if(fireEvents) {
								switch(dest){
									case '_cp0':{
										//setWhereClause('Transaction', this.category, '_cp0');
										//buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
									}
									break;
									case '_cp1':{
										//setWhereClause('Transaction', this.category, '_cp1');
										//buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
									}
									break;
									case '_det':{
										switch(container){
											case 'graphDistribution':{ // Frequency Distribution
												setElapsedFilter(this.category, dest);
												prepareDetailQueries(document.getElementById('inputTestid_det').value);
											}
											break;
											case 'barDistribution':{ // Transaction Distribution
												setWhereClause('Transaction', this.category, dest);
												prepareDetailQueries(document.getElementById('inputTestid_det').value);
											}
											break;
											case 'barResponses':{ // Response Code Distribution
												setWhereClause('Code', this.category, dest);
												prepareDetailQueries(document.getElementById('inputTestid_det').value);
											}
											break;
										}
										//setWhereClause('Transaction', this.category, '_det');
										//prepareDetailQueries(document.getElementById('inputTestid_det').value);
										console.log('barDistribution | dest: '+dest+' container: '+container)
									}
									break;
									default:{
										console.log('barDistribution | Invalid dest: '+dest)
									}
								}
							} else {
								event.preventDefault();
							}
						}
					}
				}
			}
		},
		series: [{
			name: 'Count',
			data: pointsArray
			}]
		};
	return options;
}

function barTransBreakdown (dataMin, dataAvg, dataMax, categories, container, title, label_y, fireEvents, dest) {
	var options = {
		chart: {
			renderTo: container,
			type: 'bar'
		},
		credits: {
			enabled: false
		},
		title: {
			text: title
		},	
		legend: {
			enabled: false
		},
		xAxis: {
			categories: categories,
			labels: {
				rotation: 0,
				align: 'right',
				style: {
					fontSize:'10px',
					fontWeight: 'bold'
				}
			}
		},
		yAxis: {
			min: 0,
			title: {
				text: label_y
			}
		},
		tooltip: {
			formatter: function() {
				return ''+
				this.series.name +': '+ this.y+'ms';
			}
		},
		plotOptions: {
			bar: {
				dataLabels: {
					enabled: true
				}
			},
			series: {
				point:{
					events: {
						click: function(event) {
							if(fireEvents) {
								switch(dest){
									case '_cp0':{
										setWhereClause('Transaction', this.category, '_cp0');
										buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
									}
									break;
									case '_cp1':{
										setWhereClause('Transaction', this.category, '_cp1');
										buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
									}
									break;
									case '_det':{
										setWhereClause('Transaction', this.category, '_det');
										prepareDetailQueries(document.getElementById('inputTestid_det').value);
									}
									break;
									default:{
										console.log('barTransBreakdown | Invalid dest: '+dest)
									}
								}
							} else {
								event.preventDefault();
							}
						}
					}
				}
			}
		},
		legend: {
			enabled: true,
			shadow: true
		},
		series: [{
			name: 'Min',
			data: dataMin
		}, {
			name: 'Max',
			data: dataMax
		}, {
			name: 'Avg',
			data: dataAvg
			}]
		};
	return options;
}

function barCompBreakdown (data, categories, container, title, label_y, fireEvents) {
	var options = {
		chart: {
			renderTo: container,
			type: 'bar'
		},
		credits: {
			enabled: false
		},
		title: {
			text: title
		},	
		legend: {
			enabled: false
		},
		xAxis: {
			categories: categories
		},
		yAxis: {
			min: -100,
			max: 100,
			title: {
				text: label_y
			}
		},
		tooltip: {
			formatter: function() {
				return ''+
				this.x +' | Change: '+ this.y+'%';
			}
		},
		plotOptions: {
			series: {
					point:{
						events: {
							click: function(event) {
								if(fireEvents) {
									setWhereClause('Transaction', this.category, '_cp0');
									setWhereClause('Transaction', this.category, '_cp1');
									buildComparisonView(document.getElementById('inputTestid_cp0').value, '_cp0');
									buildComparisonView(document.getElementById('inputTestid_cp1').value, '_cp1');
								} else {
									event.preventDefault();
								}
							}
						}
					}
                }
            },
		series: [{
			name: 'Change',
			data: data
		}]
	};
	return options;
}

function lineRespTrans(pointsArray, container, type, title, label_y, label_x, series_name, measurement, fireEvents, dest) {
	var options = {
	        chart: {
	            renderTo: container,
	            type: 'spline',
				events: {
					click: function(event) {
						//launchModal(container);
						
						//alert ('x: '+ event.xAxis[0].value +', y: '+ event.yAxis[0].value);
					},	
					selection: function(event) {
						if(fireEvents) {
							var min,max, ex2 ;
							if (event.xAxis) {
								selectionObj=event.xAxis[0];
								min = selectionObj.min;
								max = selectionObj.max;
							} else {
								selectionObj = this.xAxis[0].getExtremes();
								min = selectionObj.dataMin;
								max = selectionObj.dataMax;
							};
							
							//queryOverallResults(document.getElementById('inputTestid_det').value, dest);
							
							switch(dest){
								case '_cp0':{
									min_cp0=min;
									max_cp0=max;
									buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
								}
								break;
								case '_cp1':{
									min_cp1=min;
									max_cp1=max;
									buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
								}
								break;
								case '_det':{
									min_det=min;
									max_det=max;
									prepareDetailQueries(document.getElementById('inputTestid_det').value);
								}
								break;
								default:{
									console.log('lineDouble | Default');
								}
							}
							zoomStatus(true);
						} else {
							event.preventDefault();
						}
					}
				}
	        },
			credits: {
				enabled: false
			},
	        title: {
	            text: title
	        },
			legend: {
				enabled: false
			},
	        xAxis: {
	            type: 'datetime',
	            dateTimeLabelFormats: { // don't display the dummy year
	                month: '%e. %b',
	                year: '%b'
	            }
	        },
	        yAxis: {
	            title: {
	                text: label_y
	            },
	            min: 0
	        },
			plotOptions: {
				bar: {
					dataLabels: {
						enabled: true
					}
				},
				series: {
					point:{
						events: {
							click: function(event) {
								setWhereClause(type, this.series.name, dest);
								switch(dest){
									case '_cp0':{
										buildComparisonView(document.getElementById('inputTestid_cp0').value, dest);
									}
									break;
									case '_cp1':{
										buildComparisonView(document.getElementById('inputTestid_cp1').value, dest);
									}
									break;
									case '_det':{
										prepareDetailQueries(document.getElementById('inputTestid_det').value);
									}
									break;
									default:{
										console.log('lineRespTrans | Invalid dest: '+dest)
									}
								}
							}
						}
					}
				}
			},
	        tooltip: {
	            formatter: function() {
	                    return '<b>'+ this.series.name +'</b><br/>'+
	                    Highcharts.dateFormat('%e. %b, %Hh:%Mm', this.x) +' | '+ this.y.toFixed(0) +' '+measurement;
	            }
	        },

	        series: pointsArray
	}
	return options;
}
