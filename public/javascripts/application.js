/*
# This file is part of the OpenWISP Geographic Monitoring
#
# Copyright (C) 2012 OpenWISP.org
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

/* document.ready callback... */
$(document).ready(function() {
    $.ajaxSetup({ cache: false });
    owgm.enableJavascript();
    owgm.ajaxQuickSearch();
    owgm.ajaxLoading();
    if (typeof(gmaps) !== 'undefined') {
        // bind click event to the <a> that toggles the map container
        $(gmaps.mapToggle).click(function(e){
            // cache some stuff
            var container = $(gmaps.mapContainer);
            var is_visible = container.is(':visible');
            // prevent default link behaviour
            e.preventDefault();
            // toggle class hidden
            $(this).toggleClass('hidden');
            // toggle container and initialize gmap if necessary
            container.slideToggle('slow', function(){
                if(!is_visible && gmaps.map == undefined){
                    gmaps.drawGoogleMap();    
                }
            });
        });
        gmaps.drawGoogleMap();
    }
    owgm.paginator();
});


/****** OWGM scope ******/

var owgm = {

    /*** Settings and Variables ***/
    quickSearchDiv: '#access_points_quicksearch',
    loadingDiv: '#loading',
    noJsDiv: '.no_js',

    /*** Application Specific Functions ***/
    enableJavascript: function() {
        $(owgm.noJsDiv).hide();
    },

    exists: function (selector) {
        return ($(selector).length > 0);
    },

    ajaxQuickSearch: function() {
        var inputField = $(this.quickSearchDiv).find('input[type=text]');
        inputField.observe(function() {
            $(owgm.loadingDiv).fadeIn();
            inputField.parent('form').submit();
            $(owgm.loadingDiv).ajaxStop(function(){$(this).fadeOut();});
        }, 1);
    },

    path: function(path) {
        var _curr = window.location.pathname;
        var _params = window.location.search;
        if (path.charAt(0) === '/') {
            if (_curr.substr(1, owums.subUri.length) === owums.subUri) {
                return '/'+owums.subUri+path+_params;
            } else {
                return path+_params;
            }
        } else {
            return _curr+'/'+path+_params;
        }
    },

    highlightAccessPointsReport: function(tableId, upClass, downClass, statusId, highLowId, percentId) {
        var status = $(statusId);
        var highLow = $(highLowId);
        var percent = $(percentId);

        var findToHighlight = function() {
            var statusVal = status.val();
            var highLowVal = highLow.val();
            var percentVal = percent.val();

            var highlight = function(elem) {
                elem.removeClass('highlighted');

                if (statusVal === '1') {
                    var tdVal = $('td'+upClass, elem).html();
                    if (tdVal) {
                        if (highLowVal === '<') {
                            if (parseInt(tdVal.slice(0,-1)) < parseInt(percentVal)){
                                elem.addClass('highlighted');
                            }
                        } else if (highLowVal === '>') {
                            if (parseInt(tdVal.slice(0,-1)) > parseInt(percentVal)){
                                elem.addClass('highlighted');
                            }
                        }
                    }
                } else if (statusVal === '0') {
                    var tdVal = $('td'+downClass, elem).html();
                    if (tdVal) {
                        if (highLowVal === '<') {
                            if (parseInt(tdVal.slice(0,-1)) < parseInt(percentVal)){
                                elem.addClass('highlighted');
                            }
                        } else if (highLowVal === '>') {
                            if (parseInt(tdVal.slice(0,-1)) > parseInt(percentVal)){
                                elem.addClass('highlighted');
                            }
                        }
                    }
                }

            };

            $(tableId+' tr').each(function(){
                highlight($(this));
            });
        };

        $(statusId+','+highLowId+','+percentId).change(function(){
            if (status.val() !== '' && highLow.val() !== '' && percent.val() !== '') {
                findToHighlight();
            } else if (status.val() === '' && highLow.val() === '' && percent.val() === '') {
                $('.highlighted').removeClass('highlighted');
            }
        });
    },

    ajaxLoading: function() {
        $('[data-remote=true]').live('click', function(){
            $(owgm.loadingDiv).fadeIn();
            $('body, .container12, .pagination a').css('cursor', 'progress');
        }).ajaxStop(function(){
            $(owgm.loadingDiv).fadeOut();
            $('body, .container12').css('cursor', 'auto');
            $('.pagination a').css('cursor', 'pointer');
        });
    },

    dateRangePicker: function(){
        if (owgm.exists('#from') && owgm.exists('#to')) {
            var dates = $( "#from, #to" ).datepicker({
                minDate: '-6m',
                maxDate: owgm.today(),
                defaultDate: "+1w",
                showButtonPanel: true,
                changeMonth: true,
                changeYear: true,
                yearRange: 'c-10:',
                onSelect: function( selectedDate ) {
                    var option = this.id == "from" ? "minDate" : "maxDate",
                            instance = $( this ).data( "datepicker" ),
                            date = $.datepicker.parseDate(
                                    instance.settings.dateFormat || $.datepicker._defaults.dateFormat,
                                    selectedDate, instance.settings
                                    );
                    dates.not( this ).datepicker( "option", option, date );
                }
            });
        }
    },

    daysAgo: function(days) {
        return new Date().setDate(owgm.today().getDate()-days);
    },

    today: function() {
        return new Date();
    },
    
    paginator: function(){
        if($('#access_points_paginate').length > 0){
            $("#combobox select").combobox();    
        }
    },
    
    exportReport: function(export_url, file){
        this.toggleProgress();
        // local variables
        var data = [], // init array that will contain data for the excel
            $tr = $('#report tbody tr'), // the table rows
            $highlighted = $('#report tbody tr.highlighted'), // the highlighted table rows
            $elements = $highlighted.length ? $highlighted : $tr; // if any highlighted row, then pass the highlighted ones, otherwise all the rows
        // loop over each row
        $elements.each(function(i, tr){
            var row = []; // init array that will contain row info
            // loop over each table cell of current row
            $(tr).find('td').each(function(i, td){
                // push the text of this cell in the "row" array
                row.push($(td).text());
            })
            // add current row array to the "data" array
            data.push(row);
        });
        // convert data array to JSON string
        json_data = JSON.stringify(data);
        // POST the JSON string to Rails
        $.ajax({
            type: 'post',
            url: export_url,
            data: json_data,
            // if file excel has been generated successfully
            success: function(data){
                if(data == 'success'){
                    // download file
                    window.location.href = file;
                    owgm.toggleProgress();
                }
            },
            // otherwise alert user (exceptional case)
            error: function(xhr, response) {
                alert("Error: "+ xhr.status);
                owgm.toggleProgress();
            }
        });
    },
    
    // reset highlighting
    resetHighlighting: function(msg){
        var rows = $('.highlighted');
        // if any
        if(rows.length){
            // reset highlighting
            rows.removeClass('highlighted');
            // and restore default values for the selects
            $('#export-controls').parent().find('select').val(this.defaultValue)
        }
        // otherwise alert message
        else{
            alert(msg);
        }
    },
    
    // toggle progress indicator
    toggleProgress: function(id){
        // if no id specified defaults to progress-ind
        if(!id){
            id = 'progress-ind';
        }
        // create div if necessary
        if($('#'+id).length < 1){
            $('body').append('<div id="'+id+'"></div>');
            // center to the window and show
            $('#'+id).css({
                top: ($(window).height() - 55) / 2,
                left: ($(window).width() - 55) / 2
            }).fadeIn(250);
        }
        // otherwise if div has been already created before just toggle with a quick fade animation
        else{
            $('#'+id).fadeToggle(250);
        }
    }
};

/************************/
