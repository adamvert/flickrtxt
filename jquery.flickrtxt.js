/*
 *  Project: jQuery flickrtxt Plugin v1.0
 *  Description: Replace text with letters from the Flickr letter group
 *  Author: Adam Butler
 *  License: http://www.opensource.org/licenses/GPL-2.0
 */

;(function ($, window, undefined) {
    
    var pluginName = 'flickrtxt',
        document = window.document,
        mergedOptions = {},
        defaults = {

            // frequency with which a random letter is replaced, in Hz.
            flickrFreq      : 1,

            // space in pixels between words
            interwordSpace  : 20

        },

        // elements that are waiting for the main data from Flickr
        pendingElements = [];

    // The actual plugin constructor
    function Plugin(element, options, isTest) {
        this.element = element;

        $.extend( mergedOptions, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;

        // we're going to put the image data here...
        $.flickrtxt = {};
        
        // to enable unit testing of hidden methods
        if (isTest) {
            this.flicker = flicker;
            this.getPhotos = getPhotos;
            this.flickrgraphise = flickrgraphise;
            this.traverseChildNodes = traverseChildNodes;
            this.sortPhotos = sortPhotos;
            this.makeLetterEl = makeLetterEl;
            this.buildWord = buildWord;
            this.splitTextIntoWords = splitTextIntoWords;
        }

        this.init();
    }

    Plugin.prototype.init = function () {
        // have we already downloaded the image data from Flickr?
        if ($.flickrtxt.imageStore) {
            flickrgraphise(this.element);
        } else if (pendingElements.length > 0) {
            // this means another element has already triggered the data download from Flickr
            pendingElements.push(this.element);
        } else {
            pendingElements.push(this.element);
            getPhotos(flickrgraphise);
        }
    };

    var flicker = function(frequency) {
        var $images = $('.letter'),
            random          = Math.round(Math.random() * ($images.length - 1)),
            imageToChange   = $images.get(random),
            letter          = imageToChange.title,
            randomImageId   = Math.round(Math.random() * ($.flickrtxt.imageStore[letter].length - 1)),
            newImage        = $.flickrtxt.imageStore[letter][randomImageId];
        imageToChange.src = 'http://static.flickr.com/'+newImage.server+'/'+newImage.id+'_'+newImage.secret+'_s.jpg';
    };

    var getPhotos = function(callback) {
        var self = this,
            data = {
                callback: '?',
                format  : 'json',
                method  : 'flickr.groups.pools.getPhotos',
                api_key : '1c27320701d920b5af6505eeba956fa5',
                group_id: '27034531@N00',
                per_page: '500',
                extras  : 'tags'
            };
        $.getJSON('http://api.flickr.com/services/rest/?jsoncallback=?', data, function(data) {
            $.flickrtxt.imageStore = sortPhotos(data.photos.photo);
            callback.call(self);
            if (mergedOptions.flickrFreq > 0) {
                setInterval(flicker, 1000.0 / mergedOptions.flickrFreq, 'flicker');
            }
        });
    };

    var flickrgraphise = function(element) {
        var elements = (element ? [element] : pendingElements.splice(0, pendingElements.length));
        $.each(elements, function(index, element) {
            traverseChildNodes(element);
        });
    };

    // a lot of this is taken from
    // http://james.padolsey.com/javascript/replacing-text-in-the-dom-its-not-that-simple/
    var traverseChildNodes = function(node) {
        if (node.nodeType == 1) { // Element node
            node = node.firstChild;
            while (node) {
                var sibling = node.nextSibling;
                traverseChildNodes(node);
                node = sibling;
            }
        } else if (node.nodeType == 3) { // Text node
            var flickrtxtNode = document.createElement('span');
            splitTextIntoWords(node.textContent).map(function(el) {
                flickrtxtNode.appendChild(el);
            });
            node.parentNode.insertBefore(flickrtxtNode, node);
            node.parentNode.removeChild(node);
        }
    };

    // sorts the photos into a 2D array keyed on each letter
    var sortPhotos = function(data) {
        var sortedPhotos = {};
        data.forEach(function(value, index) {
            var photo = {
                id      : value.id,
                server  : value.server,
                secret  : value.secret
            };
            var letter = null;
            var tags = value.tags.split(' ');
            tags.forEach(function(value, index) {
                // search for a 1-character tag (eg. 'a', or a 2-character doubled tag (eg. 'aa')
                if (value.length == 1 || value.length == 2 && value.substr(0,1) == value.substr(1, 1)) {
                    letter = value.substr(0, 1);
                }
            });
            if (letter) {
                if (typeof sortedPhotos[letter] == 'undefined') {
                    sortedPhotos[letter] = [];
                }
                sortedPhotos[letter].push(photo);
            }
        });
        return sortedPhotos;
    };

    // creates an img element containing a matching letter selected at random from the imageStore
    var makeLetterEl = function(letter) {
        // pass through non-letter characters (TODO: numbers & punctuation)
        if (!letter.match(/[A-Za-z]/)) return document.createTextNode(letter);
        letter = letter.toLowerCase();
        var photo = $.flickrtxt.imageStore[letter][Math.round(Math.random() * ($.flickrtxt.imageStore[letter].length - 1))],
            URL = 'http://static.flickr.com/'+photo.server+'/'+photo.id+'_'+photo.secret+'_s.jpg',
            el = document.createElement('img');
        el.setAttribute('src', URL);
        el.setAttribute('title', letter);
        el.setAttribute('alt', letter);
        el.setAttribute('class', 'letter');
        return el;
    };

    // creates a span element containing images that spell out the word
    var buildWord = function(word) {
        var el = document.createElement('span');
        el.setAttribute('style', 'margin-right: '+mergedOptions.interwordSpace+'px; white-space:nowrap;');
        word.split('').map(makeLetterEl).forEach(function(letter) {
            el.appendChild(letter);
        });
        return el;
    };

    // break the text up into separate words
    var splitTextIntoWords = function(text) {
        var flickrtxt = [],
            words = text.split(' ');

        $.each(words, function(index, word) {
            if (word.length > 0 && word.match(/[a-z][A-Z]*/)) {
                flickrtxt.push(buildWord(word));
                // don't add a space after the last word...
                if (index < words.length - 1) {
                    // flickrtxt.push(document.createTextNode('\u00A0')); // Equivalent to &amp;#0160; or &amp;nbsp;
                }
            }
        });
        return flickrtxt;
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options, isTest) {
        var args = arguments;

        // Is the first parameter an object (options), or was omitted,
        // instantiate a new instance of the plugin.
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options, isTest));
                }
            });

        // If the first parameter is a string and it doesn't start
        // with an underscore or "contains" the `init`-function,
        // treat this as a call to a public method.
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            var returns;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                // Allow instances to be destroyed via the 'destroy' method
                if (options === 'destroy') {
                  $.data(this, 'plugin_' + pluginName, null);
                }
            });
            return returns !== undefined ? returns : this;
        }
    };
}(jQuery, window));