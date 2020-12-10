tinymce.PluginManager.add('footnotes', function(editor) {
    var footnoteText = null;
    function replaceTmpl(str, data) {
        var result = str;
        for (var key in data) {
            result = result.replace('{'+ key +'}',data[key]);
        }
        return result;
    }

    function showDialog() {
        var selectedNode = editor.selection.getNode();
        var selectedRange = editor.selection.getRng().endContainer;
        var name = '';
        var isFootNotes = selectedNode.tagName == 'SPAN' && editor.dom.getAttrib(selectedNode, 'class') === 'fnoteWrap';

        var selectIndex = (function(){
            if (selectedNode.className == 'fnoteWrap') {
                var num = selectedNode.childNodes[0].firstChild.nodeValue.replace(/[^0-9]/g,'');
                return num;
            }
            else {
                return selectedNode.childNodes[0];
            }
        }());

        if (isFootNotes) {
            name = selectedNode.name || decodeURIComponent(selectedNode.childNodes[0].getAttribute('data-content')) || '';
        }

        editor.windowManager.open({
            title: "Insert contents for footnote",
            id: 'footnote-dialog',
            body: {
                type: 'textbox',
                name: 'name',
                multiline: true,
                minWidth: 520,
                minHeight: 100,
                value: name
            },
            onSubmit: function(e) {
                var newfootnoteContent = footnoteText,
                    fixFootnoteContent = (function () {
                        return newfootnoteContent;
                    }()),
                    htmlTemplate = '<span class="fnoteWrap" id="#wk_ft{FOOTNOTE_INDEX}" contenteditable="false"><button type="button" class="fnoteBtn" data-content="'+fixFootnoteContent+'">{FOOTNOTE_INDEX}</button></span>';

                    var totalFootNote = editor.getDoc().querySelectorAll('.fnoteBtn');
                    var totalCount = totalFootNote.length;
                    var html;

                function findNextFD($node)
                {
                    function nextInDOM(_selector, $node) {
                        var next = getNext($node);

                        while(next.length !== 0) {
                            var found = searchFor(_selector, next);
                            if(found !== null) {
                                return found;
                            }
                            next = getNext(next);
                        }
                        return next;
                    }
                    function getNext($node) {
                        if($node.nextAll().find('.fnoteBtn').length > 0) {
                            if ($node.next().hasClass('fnoteBtn')) {
                                return $node.next().children().children();
                            }
                            else {
                                return $node.nextAll().find('.fnoteBtn');
                            }

                        }
                        else {
                            if ($node.prop('nodeName') == 'BODY') {
                                return [];
                            }
                            return getNext($node.parent());
                        }
                    }
                    function searchFor(_selector, $node) {
                        if (!$node) {return false};
                        if($node) {
                            return $node;
                        }
                        else {
                            var found = null;
                            $node.children().each(function() {
                                if ($node)
                                    found = searchFor(_selector, $(this));
                            });
                            return found;
                        }
                        return null;
                    }
                    var currentClassNot_NextClass = nextInDOM('.fnoteBtn', $node);
                    return currentClassNot_NextClass;
                }

                // destroy the embedded footnote HTML editor
                tinymce.activeEditor.destroy();

                var nextFD = findNextFD($(selectedRange));
                if(nextFD.length) {
                    nextFD = nextFD[0];
                    var foundIdx;
                    for(foundIdx = 0; foundIdx < totalCount; foundIdx++) {
                        if(nextFD == totalFootNote[foundIdx]) {
                            break;
                        }
                    }
                    if (selectIndex < totalCount) {
                        // modify
                        html = replaceTmpl(htmlTemplate,{FOOTNOTE_INDEX : $(totalFootNote[selectIndex-1]).html()});
                        editor.selection.select(selectedNode);
                    }
                    else {
                        // anywhere add
                        html = replaceTmpl(htmlTemplate,{FOOTNOTE_INDEX : $(totalFootNote[foundIdx]).html()});
                        editor.selection.collapse(0);
                    }

                } else {
                    // last add
                    html = replaceTmpl(htmlTemplate,{FOOTNOTE_INDEX : totalCount + 1});
                    editor.selection.collapse(0);
                }

                editor.execCommand('mceInsertContent', false, html);

                // index realignment
                $(editor.getDoc()).find('.fnoteBtn').each(function(idx){
                    $(this).text((idx+1));
                    $(this).parent().attr('id','#wk_ft' + (idx +1));
                });
            }
        });
        tinymce.init({
            selector: '#footnote-dialog textarea',
            content_css: '/css/frontend.css',
            forced_root_block : 'div',
            skin: false,
            branding: false,
            statusbar: true,
            menubar: false,
            plugins: ['link'], 
            toolbar: 'bold italic | link',
            setup: function(editor) {
                editor.on('init', function (e) {
                    editor.focus();
                });
                editor.on('keyup', function(e) {
                    footnoteText = sanitizeHtml(footnoteText = editor.getContent());
                });
                editor.on('change', function(e) {
                    footnoteText = sanitizeHtml(footnoteText = editor.getContent());
                });
            }
        });
  
    }
    editor.addCommand('mceFootnotes', showDialog);
    editor.addButton("footnotes", {
        title : 'Insert footnote',
        image : tinyMCE.baseURL + '/tinymce/plugins/footnotesHtml/img/footnotes.png',
        onclick: showDialog,
        stateSelector: 'span.fnoteWrap'
    });

    function sanitizeHtml(str) {
        str = str.replaceAll('"', "&quot;"); // first, replace all double quotes with entity – works for quotes in normal text
        str = str.replaceAll("'", "&apos;"); // also, replace all single quotes and apostrophes with entity
        str = str.replace(/(\w+)\s*=\s*((&quot;)(.*?)\3|([^>\s]*)(?=\s|\/>))(?=[^<]*>)/g, "$1='$4'"); // now replace &quot; with single quotes in attributes
        return str;
    }
});
  