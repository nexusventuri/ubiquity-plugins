mdUtils.CreateCommand({
        name: "to-href",
        takes: {"Links selection": noun_arb_text},
        execute: function(hrefs) {
                var text = hrefs.text;
                var splitted;
                var prepend = "";
                if(text.search(/http:/) != -1){
                        splitted = text.split("http://");
                        prepend = "http://";
                } else {
                        splitted = text.split("\n");
                }
                var index;
                var result = "";
                for(index =0; index < splitted.length; index ++){
                        var trimmedString = splitted[index].replace(/\s*((\S+\s*)*)/, "$1").replace(/((\s*\S+)*)\s*/, "$1");
                        displayMessage(trimmedString + splitted[index]);
                        if( trimmedString != ""){
                                result += "<a href='" + prepend+trimmedString + "' target='_blank'>" +  prepend+trimmedString + "</a><br/>";
                        }
                }
                if(result != ""){
                        CmdUtils.setSelection(result);
                } else{
                        displayMessage("nothing to do");
                }
        }
});
/*
var copiedText = "";
CmdUtils.CreateCommand({
        name: "copyHtml",
        takes: {"A text to be copied": noun_arb_text},
        execute: function(text){
                var copiedText  = text.html;
                displayMessage(copiedText);
        }
});

CmdUtils.CreateCommand({
        name:"pasteHtml",
        execute: function (){
                CmdUtils.setSelection(copiedText);
                displayMessage(copiedText)
        }
})
*/
//need to fix how the links and the text are treated. if you have links and text please use both
CmdUtils.CreateCommand({
    name:"to-rapidshare-download",
    takes:{"a piece of text will bring you directly to the rapidshare download file": noun_arb_text},
    execute: function(hrefs){
        var html = hrefs.html;
        var text = hrefs.text;
        var splitted;
        if(html.search(/<a[^>]*>/) != -1){
            //displayMessage("links");
            var hrefRegex = new RegExp(/href=['"]([^"']*)['"]/g);
            var currentHref;
            text = "";
            while(currentHref =  hrefRegex.exec(html)){
                text += ""+currentHref[1]+"\n";
            }
        }
        splitted = text.split("http:");
        //displayMessage(""+splitted[1]);
        var index;
        var result = "";
        var hrefResult = "";
        var foundElements = 0;
        
        for(index =0; index < splitted.length; index ++){
            if(splitted[index].search("//rapidshare") == 0){
                jQuery.ajax({
                    type: "GET",
                    url:"http:"+splitted[index],
                    error: function(){
                        displayMessage("error during the connection to rapidshare");
                    },
                    success: function(responseText){
                        var regex = new RegExp(/action=['"][^"']*['"]/g);
                        var result = "";
                        var current;
                        var validUrl = "";
                        if(responseText.search(/<h1>Error<\/h1>/gi) != -1){
                            displayMessage("one or more links are not available");
                        } else {
                            while((current = regex.exec(responseText)) && validUrl == ""){
                                if((current+"").search("rapidshare")){
                                    validUrl = (current+"").replace("action=", "").replace('"',"").replace("'", "");
                                }
                            }
                            var submitParams={
                                'dl.start': "PREMIUM"
                            };

                            jQuery.ajax({
                                type: "POST",
                                url: validUrl,
                                data:  submitParams,
                                error: function(a, b, c) {
                                    displayMessage("boh" + a + b + c);
                                },
                                success: function(a, b, c){
                                    var regex = new RegExp(/action=['"][^"']*['"]/g);
                                    var downloadUrl= "";
                                    var current;
                                    while((current = regex.exec(a)) && downloadUrl == ""){
                                        if((current+"").search("rapidshare")&& ((current+"").search("https") == -1)){
                                            downloadUrl = (current+"").replace("action=", "").replace(/"/g,"").replace(/'/g, "");
Utils.openUrlInBrowser(downloadUrl);
                                        }
                                    
                                    }
                                    hrefResult += "<a href='"+downloadUrl+"' style='' class='rapidshareDownloadLink'>"+downloadUrl+"</a><br/>";
                                    CmdUtils.setSelection(hrefResult);                            
                                }
                            });
                        }
                    }
                });
            }
        }
        
        //displayMessage("finish");
    }
    
});

CmdUtils.CreateCommand({
        name:"append-to-email",
        takes:{"A text to be appended to the current email": noun_arb_text},
        execute: function(text){
                var gmailTab = findGmailTab();
                var document = context.focusedWindow.document;
                var html = text.html;
                var location = document.location;
                var title = document.title;
                var pageLink = "<a href=\"" + location + "\">" + title + "</a>";
                if(html){
                        html = ("<p>From the page " + pageLink + ":</p>" + html);
                } else {
                        html = "<p>You might be interested in " + pageLink + ".</p>";
                }
               
                if(gmailTab == null){
                        //CmdUtils.commands.email(text);
                        displayMessage("you are not writing an email.. use the email command instead..");
                        var params = {fs:1, tf:1, view:"cm", su:title, to:toAddress, body:html};
                        Utils.openUrlInBrowser("http://mail.google.com/mail/?" +
                        Utils.paramsToString(params));
                       
                }else{
                        var gmonkey = gmailTab.document.defaultView.wrappedJSObject.gmonkey;
                        var continuer = function(){
                                try{
                                        var gmail = gmonkey.get("1.0");
                                        var active = gmail.getActiveViewElement();
                                        var iframe = active.getElementsByTagName("iframe")[0];
                                        if(iframe){
                                                iframe.contentDocument.execCommand("insertHTML", false, html);
                                        } else {
                                        var body = composeMail.ownerDocument.getElementsByName("body")[0];
                                        html = ("Note: the following probably looks strange because " +"you don't have rich formatting enabled.  Please " +
                                                        "click the 'Rich formatting' link above, discard " +
                                                        "this message, and try " +
                                                        "the email command again.\n\n" + html);
                                                                body.value = html;
                                        }
                                } catch (e) {
                                        displayMessage({text: "A gmonkey exception occurred.", exception: e});
                                }
                        }
                       
                        gmonkey.load("1.0", continuer);
                        gmailTab.focus();
                }
               

        }
})
    
    

CmdUtils.CreateCommand({
    name:"checkLinksOnPage",
    //takes: {"A list of selector to check if the linked page is empty or not": noun_arb_text},
    modifiers:{"non-empty": noun_arb_text, "should-have": noun_arb_text, "without": noun_arb_text},
    preview: "checksthe links on a page, non-empty takes a list ofselectors that shouldhave some text inside, should contain is a listof selectors thatcontains the body of the page (and should appear)",
    execute: function(what, mods){
        var currentDocument = Application.activeWindow.activeTab.document;
        var shouldHave = mods["should-have"].text || "";
        var userSelectors = mods["non-empty"].text || "";
        var without = mods["without"].text || "";
        displayMessage(""+without);
        
        var count = 0;
        var checkedElementsDiv = createDomElementOnRoot('followedLinksSoFar', "links followed so far:");
        var emptyPagesDiv = createDomElementOnRoot('empty Pages Found',"pagesWithEmptyContent following the rules(non empty'"+userSelectors+"'  and should have '"+shouldHave+"' ) :");
        var linkErrorDiv = createDomElementOnRoot('linkErrorInPage', "errors in page");
        var withoutDiv = createDomElementOnRoot('without', "pages that have elements like: " + without);
        
        
        //alert(shouldHave);
        /*defining useful functions here*/  
        function appendTextToElement(element, text){
          jQuery(element).append(currentDocument.createTextNode(""+text));
          jQuery(element).append(currentDocument.createElement("br"));
        }
        function callNext(){
          count ++;
          if(count%30 == 1){
           //displayMessage("processedlinks: #" + jQuery("a.linkChecked",currentDocument).length + "remaining links: #" +getNotVisited().length + " over: #" +jQuery("a",currentDocument).not("[href*=/logout]").length);
          }
          var aElements = getNotVisited();
          if(aElements.length > 0)
            callGet(aElements.get(0));
        }

        function createDomElementOnRoot(classname, title){
          var result = currentDocument.createElement('div');
          result.className = classname;
          currentDocument.getElementsByTagName("body").item(0).appendChild(result);
          appendTextToElement(result, title);
          return result;
        }

        function callGet(element){
          var currentHref = jQuery(element).attr("href");
          jQuery("a[href=" + currentHref + "]", currentDocument).addClass("linkChecked");
          jQuery.ajax({
            url:(getUrl(currentHref)),
            error: function(a, b){
              //alert("error on" + this.url)
              jQuery(hrefSelectorPermutations(this.url), currentDocument).css("background-color" ,"#DD4477").css("color", "white").addClass("linkChecked");
              //alert("error on" + this.url);
              appendTextToElement(linkErrorDiv, this.url);
              callNext();
            },
            success: function(a, b){
              //alert("success on" + this.url + " selectors: '"+userSelectors+"'");
                var oneEmpty = false;
                var containForbiddenElements = false;
                if(userSelectors != ""){
                    var possiblyEmptyElements = jQuery(userSelectors,a);
                    
                    possiblyEmptyElements.each(function(){
                        if(jQuery(this).html().replace(/^\s+|\s+$/g, '') == ""){
                            oneEmpty = true;
                        }
                    });
                } 
                if(shouldHave != ""){
                    var possiblyEmptyElements = jQuery(shouldHave,a);
                    if(possiblyEmptyElements.length == 0)
                        oneEmpty = true;
                }
                if(without != ""){
                    var possiblyEmptyElements = jQuery(without,a);
                    if(possiblyEmptyElements.length != 0)
                        containForbiddenElements= true;
                }
                if(containForbiddenElements){
                    jQuery(hrefSelectorPermutations(this.url), currentDocument).css("background-color", "yellow").css("color", "black").addClass("linkChecked").attr("targer", "_blank");
                    appendTextToElement(withoutDiv, this.url);
                } else if(oneEmpty){
                    jQuery(hrefSelectorPermutations(this.url), currentDocument).css("background-color", "#AAAAAA").css("color", "black").addClass("linkChecked").attr("targer", "_blank");
                    appendTextToElement(emptyPagesDiv, this.url);
                }
                else{
                    jQuery(hrefSelectorPermutations(this.url), currentDocument).css("background-color", "#AADDDD").css("color", "black").addClass("linkChecked").attr("targer", "_blank");
                    appendTextToElement(checkedElementsDiv, this.url);
                }
                //alert("before call next");
                callNext();
        //      ("a[href=" + currentHref + "]");
            }
          })
        }
        function getNotVisited(){
          return jQuery("a", currentDocument).not(".linkChecked").not("[href*=/logout]").not("href^=mailto");
        }
        function hrefSelectorPermutations(url){
            return "a[href=" + url + "],a[href="+ getAbsoluteUrl(url) +"],a[href="+ getPageName(url) +"]";
        }
        function getUrl(text){
          var url = text||"";
          var currentSite = currentDocument.location.hostname;
          var basePath = currentDocument.location.pathname;
          basePath = basePath.substring(0, basePath.lastIndexOf("/"));
          if(url.search(/http:/) == 0 || url.search(/https:/) == 0){
             return url;
          } else if(url.search("/") == 0) {
            return "http://"+currentSite +url;
          } else {
            return "http://" + currentSite + basePath + "/"+ url;
          }
        }
        function getPageName(text){
          var currentSite = currentDocument.location.hostname;
          var basePath = currentDocument.location.pathname;
        basePath = basePath.substring(0, basePath.lastIndexOf("/"));
          return text.replace( "http://" + currentSite + basePath + "/", "");
        }
        function getAbsoluteUrl(text){
          var currentSite = currentDocument.location.hostname;
          return text.replace("http://"+currentSite, "");
        }

        function alert(text){
          displayMessage(text);
        } 
        
        var linksWithSpaces = createDomElementOnRoot('linksWithSpaces', "links with blank characters:");
        //displayMessage(getNotVisited().length);
        var elements = getNotVisited();
        elements.each(function(){
          var originalHref = jQuery(this).attr("href");
          var trimmedHref = originalHref.replace(/^\s+|\s+$/g, '');
          
          if(originalHref != trimmedHref){
                //displayMessage("test");
                jQuery(this).attr("href", trimmedHref);
                jQuery(this).css("background-color" ,"#DDDDDD");
                appendTextToElement(linksWithSpaces, trimmedHref);
          }
        });

        var urls = "";
        var maxRequests = 10;
        var end = (elements.length > maxRequests ) ? maxRequests : elements.length -1;
        callNext();
    }
});
CmdUtils.CreateCommand({
  name: "replace",
  takes: {"what": noun_arb_text},
  modifiers: {"with": noun_arb_text, "in": noun_arb_text},
  
  preview: function( pblock, what, mods ) {
    // args contains .with and .in, both of which are input objects.
    var msg = 'Replaces "${whatText}" with ${withText} in ${inText}.';
    var subs = {whatText: what.text, withText: mods["with"].text, inText: mods["in"].text};
    
    pblock.innerHTML = CmdUtils.renderTemplate( msg, subs );
  },
  
  execute: function( what, mods ) {
    // If the scope text isn't specified, use the current selection.
    CmdUtils.displayMessage("text test:" + mods["in"].text +  "other test" + mods["with"].text);
    var text = mods["in"].text || CmdUtils.getSelection();
    var newText = text.replace( what.text, mods["with"].text, "i");
    CmdUtils.setSelection( newText );
  }
});
