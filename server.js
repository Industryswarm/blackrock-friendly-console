#!/usr/bin/env node

/*!
* Blackrock Friendly Console
* And Application Server Initialisation
*
* Copyright (c) 2020 Darren Smith
*/

;!function(undefined) {

	var msgCount = 0, debugMsgCount = 0, startupMsgCount = 0, evtQueue = [];
	var errorMsgCount = 0, httpMsgCount = 0, routerMsgCount = 0, dayjs;
	var core, name = "", version = "", httpReqMsgCount = 0, totalEvtRate = 0;

	var enableSmartDashboard = true;

	if(enableSmartDashboard) {
		var blessed = require('blessed');
		var screen = blessed.screen({ smartCSR: true });
		screen.title = 'Blackrock Application Server';
		var dashboardBox = blessed.box({
		  top: 'center', left: 'center', width: '100%', height: '100%',
		  content: '', tags: true, border: { type: 'line' },
		  style: { fg: 'white', bg: 'blue', border: { fg: '#f0f0f0' } }
		});
		var eventLogBox = blessed.box({
		  top: 'center', left: 'center', width: '100%', height: '100%', scrollable: true, scrollbar: true,
		  content: '', tags: true, border: { type: 'line' },
		  style: { fg: 'white', bg: 'blue', border: { fg: '#f0f0f0' } }
		});

		screen.append(eventLogBox);
		screen.append(dashboardBox);
		dashboardBox.focus();
		dashboardBox.key('enter', function(ch, key) {
		  	dashboardBox.hide();
		  	eventLogBox.show();
		  	eventLogBox.focus();
		  	renderScreen();
		});
		eventLogBox.key('enter', function(ch, key) {
		  	eventLogBox.hide();
		  	dashboardBox.show();
		  	dashboardBox.focus();
		  	renderScreen();
		});
		eventLogBox.on('keypress', function(ch, key) {
			if (key.name === 'down') {
				eventLogBox.scroll(10);
				screen.render();
			} else if (key.name === 'up') {
				eventLogBox.scroll(-10);
				screen.render();
			}
		});

		var renderScreen = function(evt){

			dashboardBox.setContent(`\n
================================================================================================

                *                   
          ,%%      ,%#              
      &%    /%%%%%%#    %%          
  %%    #%%%%%%%%%%%%%(     #%,     
%%     %%%%%%%%%%%%%%%%           /%  
%        %%%%%%%%%%%%%%%             %        IndustrySwarm
%       #%%%%%%%%%%%%%%%%            %        Blackrock Application Server
%  ,%% #%%%%%%%%%%%%%%%,*%%%     %&  %        Copyright 2020, Darren Smith.
%  ,%%% %%%%%%%%%%%%# %%%%%%%%%%%%&  % 
%  ,%%%%.%%%%%%%%# %%%%%%%%%%%%%%%&  %        Server Name:
%  ,%%%%    (%% %%%%%%%%%%%%%%%%%%&  %        ` + name + ` v` + version + `
%  ,%%         %%%%%%%%%%%%%%%%%%%&  % 
##  %           %%%%%%%%%%%%%%%%%%  .%        
%%           %%%%%%%%%%%%%%%    &%          
   %%     %%%%%%%%%%%%.    %%       
       .%#    %%%%    ,%(           
            %%    %%                 

------------------------------------------------------------------------------------------------\n
			
			Total Events: ` + msgCount + `			 HTTP Event Count:  ` + httpMsgCount + `
			Debug Event Count: ` + debugMsgCount + `		Router Event Count:  ` + routerMsgCount + `
			Startup Event Count:  ` + startupMsgCount + `	   HTTP Request Count:  ` + httpReqMsgCount + `
			Error Event Count:  ` + errorMsgCount + 	`	     Events / HTTP Request:  ` + Math.round((msgCount / httpReqMsgCount) * 100) / 100 + `
			Total Event Rate: ` + totalEvtRate + `
			`);

			if(evt && evt.datestamp && evt.level && evt.module && evt.msg) {
				eventLogBox.insertBottom(evt.datestamp + " (" + evt.level + ") " + evt.module + " > " + evt.msg);
				eventLogBox.scroll(10);
			}

			screen.render();

		}
	}

	var initObject = {};
	if(enableSmartDashboard) { initObject.silent = true; }
	require('is-blackrock').init(initObject)
		.then(function(blackrock) {
			core = blackrock;
			dayjs = blackrock.lib.dayjs;
			name = blackrock.pkg().name;
			version = blackrock.pkg().version;
			blackrock.on("log", function(evt) {
				msgCount ++;
				evtQueue.push(evt);
				if(evtQueue.length > 10) { evtQueue.pop(); }
				var dateOne = dayjs(evtQueue[0].datestamp);
				var dateTwo = dayjs(evtQueue[evtQueue.length - 1].datestamp);
				var lapsed = dateOne.diff(dateTwo);
				totalEvtRate = Math.round((evtQueue.length / (lapsed / 1000)));
				if(evt.level == "debug") { debugMsgCount ++; }
				if(evt.level == "startup") { startupMsgCount ++; }
				if(evt.level == "error") { errorMsgCount ++; }
				if(evt.module == "Blackrock HTTP Interface") { httpMsgCount ++; }
				if(evt.module == "Blackrock HTTP Interface" && evt.msg == "Received Incoming Request") { httpReqMsgCount ++; }
				if(evt.module == "Blackrock Router") { routerMsgCount ++; }
				if(enableSmartDashboard) { renderScreen(evt); }
			});
		});

}();