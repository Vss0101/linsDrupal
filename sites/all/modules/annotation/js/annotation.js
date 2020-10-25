var attached = null;
var dialog = null;
var highlight = null;

function attach_media_upload(type, id) {
	var ret = {type:type, id:id};
	attached = ret;
}

function attach_highlight_position(page_id, start_index, end_index, start_offset, end_offset) {
	var ret_highlight = {
		page_id:       page_id,
		start:         start_index,
		end:           end_index,
		start_offset:  start_offset,
		end_offset:    end_offset
	};
	highlight = ret_highlight;
}

(function($){
	// When the documet is ready
	$(function() {
		// Define the click action for publish button
		// When uers click the publish button, call the publish() function
		$('#postbox .btn-publish').click(publish);
		// Define the click action for image attaching button
		// When uers click the image button, call the openDialog() function
		$('.postbox .toolbar a.toolbar-btn').click(openDialog);

		// Add the highlighting functions here
		$("#viewerContainer #viewer").mouseup(function(event){
 	    	if (window.getSelection){// For standard browsers: Chrome, Firefox...
 	    		var selection = window.getSelection();
        		if (selection.rangeCount > 0) {
        			var selectionRange = selection.getRangeAt(0); //Range对象
            		var startNode = selectionRange.startContainer.parentNode;
            		var endNode = selectionRange.endContainer.parentNode;
            		if (startNode && endNode) {
            			var start_index = $(startNode).index(); // Get Start selected node
            			var end_index = $(endNode).index(); // Get Last selected node
            			if (end_index < start_index) {
            				alert("Error happened in javascript. Please try again later.");
            				return false;
            			}
            			var start_offset = selectionRange.startOffset;
	            		var end_offset = selectionRange.endOffset;
	            		if (start_offset < 0)
	            			start_offset = 0;
	            		if (end_offset < 0)
	            			end_offset = 0;

            			// Get book page no.
            			var pageNode = $(startNode).parent().parent();
            			var page_id = $(pageNode).attr('id').replace(/[^0-9]/ig,"");
            			attach_highlight_position(page_id, start_index, end_index, start_offset, end_offset);
//            			console.log(highlight);
            		}
        		}

        		return false;
 	    	}

 			if (document.selection){// For IE: ToDo
 				selection_elements = document.selection.createRange();
 				return false;
 			}

	    	return false;
		});

		// Add the highlighting function for a selected annotation node
		// @TODO Define an ajax request type for retrieving the highlight information for an annotation
		$(".node-annotation.node-teaser").hover(function(event){
			if( $(this).hasClass('sending') ){
				//alert(Drupal.t('System is processing your request. Please wait...'));
				return false;
			}

			// @TODO Add codes here to get the annotationId from current selection node
			// Refer to the codes for obtaining the book page no.
			//
			var str = $(this).attr('id');
			var node=str.split('-');
			var annotationId = node[1];

			//alert(annotationId);
			if (annotationId > 0) {
				var data = {
					act: 'getHightlight', // Add response actions for this act
					annotation_id: annotationId

				};

				var option = ajaxOption();
				var current = $(this)
				option = $.extend(option, {
					data : data,
					// complete : function(){
					// 	$("#node"+annotationId).removeClass('sending');
					// },
					success : function(json) {
		                if (json.error) {
		                    ajaxError(json.error);
		                    console.log('error')
		                }
		                else if (json.success){
		                	console.log(json);

		                	// @TODO Update the codes here to highlight the correct texts
		                		//alert(getParam('page_id'));

		                    var highlightdiv = addHighlight(json.node.page_id,json.node.highlight_start, json.node.highlight_end, 0, 0);
		                    // console.log(highlightdiv instanceof jQuery)
		                    const line = drawLine(highlightdiv.get(0), current.get(0));
		                    current.after(line);
		                    // $('body').append(line);
		                    // current.append(line)
		                    // console.log(typeof(highlightdiv))
		                    // console.log(typeof(current))
		                    // drawLine(highlightdiv,current);
		            //         jsPlumb.ready(function () {
										    //   jsPlumb.connect({
										    //     source: current.get(0),
										    //     target: highlightdiv.get(0),
										    //     endpoint: 'Dot',
										    //     connector:['Straight']
										    //   })
										    // })
		                }
					}

				});

				$(this).addClass('sending');
				$.ajax(option);
				//$(this).removeClass('sending');
			}

			return false;
		},
		function(event){
				if( $(this).hasClass('sending') ){
					$(this).removeClass('sending');
					$("#line").remove();
					return false;
			}
		})
	});



	function getTop(e){
		var offset=e.offsetTop;
		console.log(offset);
		if(e.offsetParent!=null) offset+=getTop(e.offsetParent);
		return offset;
	}

	function getLeft(e){
		var offset=e.offsetLeft;
		if(e.offsetParent!=null) offset+=getLeft(e.offsetParent);
		return offset;
	}


	function drawLine(startObj, endObj) {
        var html = "";
        var y_start = getTop(startObj);
        var x_start = getLeft(startObj);
        var y_end = getTop(endObj);
        var x_end = getLeft(endObj);
        // var y_start =  Number(startObj.css("top").replace("px","")) + startObj.height()/2;
        // var x_start =  Number(startObj.css("left").replace("px","")) + startObj.width();
        // var y_end =  Number(endObj.css("top").replace("px","")) + endObj.height()/2;
        // var x_end =  Number(endObj.css("left").replace("px",""));

        console.log(y_start,x_start,y_end,x_end);

        var deg = 0;
        if (y_start == y_end)
        {
            if (x_start > x_end) {
                var t = x_start;
                x_start = x_end;
                x_end = t
                deg = 180;
            }
            length = Math.abs(x_end - x_start);
        } else if (x_start == x_end)
        {
            deg = 90;
            if (y_start > y_end) {
                var t = y_start;
                y_start = y_end;
                y_end = t
                deg = 270;
            }
            length = Math.abs(y_end - y_start);
        } else {
            var lx = x_end - x_start;
            var ly = y_end - y_start;
            var length = Math.sqrt(lx * lx + ly * ly);
            var c = 360 * Math.atan2(ly, lx) / (2 * Math.PI);
            c = c <= -90 ? (360 + c) : c;
            deg = c;
        }

        // var html = document.createElement("div");

        // html.innerHTML = "<div class='rotate' style"+"='position:absolute; z-index:9999;"+"top:" +y_start+ "px;left:" +x_start
        //         +"px;width:"+length+"px;transform:rotate("+deg+"deg)'>" +
        //                 "<i class='arrow-img'></i>"+
        //                 "<i class='con-img'></i></div>";

        var width = Math.abs(x_start - x_end);
        var height =Math.abs(y_start - y_end);
        var left = (x_start - x_end < 0 ? x_start : x_end );
        var top = (y_start - y_end < 0 ? y_start : y_end)  ;
        width = Math.sqrt(width*width+height*height);
        var div=document.createElement("div");

       // var div2=document.createElement("div");
        // div.innerHTML='<div id="line_div" class="rotate" style="top:'+y_start+'px;left:'+x_start+'px;width:'+length+'px;transform:rotate('+deg+'deg)>"
        // 							<i class="arrow-img"></i>
        // 							<i class="con-img"></i></div>'
				div.innerHTML=' <div id="line" style="width:'+width+'px;height:'+height+'px;position:absolute;visibility:visible;left:'+left+'px;top:'+top+'px;border-bottom:1px solid #000000;transform-origin:bottom left;-webkit-transform:rotate('+deg+'deg);"></div>';
				//div2.innerHTML=' <div id="line_div" style="width:'+width+'px;height:'+height+'px;position:absolute;visibility:visible;left:'+left+'px;top:'+top+'px;border:1px solid #000000;"></div>';
				if($("#line").length===0)
				{
					document.body.appendChild(div);
				}
				//document.body.appendChild(div2);

        console.log(html);
        return html;
    }

	function ajaxOption(){
		return {
			url  : Drupal.settings.annotation.ajax_url,
			type : 'POST',
			dataType : 'json',
			timeout : Drupal.settings.annotation.timeout * 1000,
			error : ajaxError
		};
	}

	function ajaxError(jqXHR, textStatus, errorThrown){
		switch(textStatus){
		case 'error':
		 	$msg = 'Error happened in sending the request. Please try again later.';
		  break;
		case 'timeout':
		 	$msg = 'Request timeout. Please check your network connection or try again later.';
		 	break;
		default:
			$msg = textStatus;
		}

		alert(Drupal.t($msg));
	}

    // The openDialog() function for clicking the image button
	function openDialog(){
		if( !dialog ){
			// init the dialog
			dialog = $('<div id="postbox-dialog"></div>').hide().appendTo($('body')).css({"background-color":"yellow","font-size":"200%"});

			// Define the close button for the dialog
			// Define the click event for the close button
			$('<a href="javascript:void(0);" class="btn-close"></a>')
			.appendTo(dialog)
			.click(closeDialog);
		}

		if( !dialog.is(':visible') ) {
			var content = $('#image-dialog');
			// Check the existense of the image upload dialog
			if( content.length == 0 ) {
				content = create_image_dialog();
				content.addClass('dialog');
			}
			content.show().appendTo(dialog);
			var pos = $(this).offset();
			dialog.css('left', pos.left-360).css('top', pos.top + 15).slideDown();
		}

		return false;
	}

    // The closeDialog() function for clicking the dialog close button
	function closeDialog() {
		resetDialog();
		return false;
	}

	function resetDialog(){
		if( dialog ) {
			dialog.hide();
			attached = null;
			var remove_btn = $('input#edit-fid-remove-button');
			if( remove_btn.length != 0 ){
				remove_btn.mousedown();
			}
			$('.dialog', dialog).hide().appendTo($('body'));
		}
	}

	function create_image_dialog(){
		var imageDialog = $('<div id="image-dialog"></div>');
		var upload_tab = $('#image-uploader');
		if(upload_tab.length != 0){
			upload_tab.show().css({position:'', left:''}).appendTo(imageDialog);
		}

		return imageDialog;
	}

    // The publish() function for clicking the publish button
	function publish(){
		if( $(this).hasClass('sending') ){

			alert(Drupal.t('System is processing your request. Please wait...'));
			return false;
		}

		var text = $.trim($('#postbox #rp-annotation').val());
		if(text == '') {
			alert(Drupal.t('Please add some texts in the comment box.'));
			return false;
		}
		var data = {
			act: 'publish',
			msg: text,
			book_id: Drupal.settings.annotation.annotation_bid
		};

		if( attached ) {
			data.attach = attached;
		}

		if ( highlight ) {
			data.highlight = highlight;
		}

		var option = ajaxOption();
		option = $.extend(option, {
			data : data,
			complete : function(){
				$('#postbox .btn-publish').removeClass('sending');
			},
			success : function(json) {
                if (json.error) {
                    ajaxError(json.error);
                }
                else if (json.success){
                    $("#start").val('');
                    $("#end").val('');
                    $('#postbox #rp-annotation').val('');
                    closeDialog();
                	window.location.reload();
                }
			}
		});

		$(this).addClass('sending');
		$.ajax(option);

		return false;
	}

	// The addHighlight() function for show the highlighting texts for an annotation
	function addHighlight(page_id, start_index, end_index, start_offset, end_offset) {
		if (start_index < 0 || end_index < 0)
			return;

		if(window.getSelection) {
		   if (window.getSelection().empty) {
		     window.getSelection().empty();
		   } else if (window.getSelection().removeAllRanges) {  // Firefox
		     window.getSelection().removeAllRanges();
		   }

		    // Show highlights
		    var page_container = $("#pageContainer"+page_id+" .textLayer");
		    if( page_container.length > 0) {
				var anchor_node = page_container.children("div").get(start_index);
				var focus_node = page_container.children("div").get(end_index);
				if (anchor_node && focus_node) {
					var selection_element = window.getSelection();
				    var range = document.createRange();
				    range.setStart(anchor_node, start_offset); // Set the default offset as 0
				    range.setEnd(focus_node, end_offset); // Set the default offset as 0
				    selection_element.addRange(range);
				}
			}
			// console.log($(anchor_node) instanceof jQuery);
			return $(anchor_node);
			//drawLine(page_container.children("div"),div2);

		} else if (document.selection) {  // IE @TODO
		  document.selection.empty();
		}

		return false;
	}

})(jQuery);
