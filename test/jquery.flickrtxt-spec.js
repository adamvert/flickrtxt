var chai = require("chai"),
    jsdom = require("jsdom"),
    jQuery = require("jQuery");

var expect = chai.expect;

window = jsdom.jsdom("<html><body></body></html>").createWindow();
document = window.document;

var $ = global.jQuery = jQuery.create(window);


$('<h1>').html('This is a test').appendTo('body');

require("../jquery.flickrtxt");

describe('flickrtxt', function() {

    it('should be defined on jquery object', function() {
        expect(typeof $(document.body).flickrtxt).to.equal('function');
    });
});

describe('The photo data from Flickr', function() {

    this.timeout(5000);

    before(function(done) {
        // call with isTest = true to make "private" methods available
        $('h1').flickrtxt({}, true);

        console.log("    [Retrieving photo data from Flickr...]");
        $('h1').flickrtxt('getPhotos', function() { done(); });
    });

    it('should contain at least one photo for each letter', function() {
        var letters = [];
        for (var prop in $.flickrtxt.imageStore) {
            letters.push(prop);
        }
        expect(letters.length).to.be.at.least(26);
    });

});

describe('The txt deconstruction apparatus', function() {

    var letter, word;

    before(function() {
        letter = $('h1').flickrtxt('makeLetterEl', 'a');
        word = $('h1').flickrtxt('buildWord', 'flickrtxt');
    });

    it('should replace a letter with an img element', function() {
        expect($(letter).prop('tagName')).to.equal('IMG');
    });

    it('should give the img element an alt text with the letter in question', function() {
        expect($(letter).attr('alt')).to.equal('a');
    });

    it('should replace a word with span full of img elements', function() {
        expect($(word).prop('tagName')).to.equal('SPAN');
        expect($(word).children().length).to.equal(9);
        expect($($(word).children()[0]).prop('tagName')).to.equal('IMG');
    });

});

// describe('deconstructing the txt', function() {

//     it('should break words into array', function() {
//         var brokenTxt = $('h1').flickrtxt('splitTextIntoWords', 'This is a test');
//         expect(typeof brokenTxt).to.equal('object');
//         // expect($(brokenTxt[0])).to.equal('This');
//     });
// });

// describe('bar rating plugin on init with custom options', function () {

//     it('should update defaults', function () {
//         var BarRating;
//         BarRating = new root.BarRating();
//         BarRating.init({
//             showValues: false
//         });
//         expect(BarRating.options).to.be.a('object');
//         expect(BarRating.options.showValues).to.equal(false);
//         expect(BarRating.options.showSelectedRating).to.equal(true);
//     });

// });