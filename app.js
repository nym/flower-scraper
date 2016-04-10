var Flickr = require("node-flickr");
var http = require('https');
var fs = require('fs');
var crypto = require('crypto');
var slug = require('slug')

var keys = {"api_key": "..."}
flickr = new Flickr(keys);

var flickrMgr = {}

var flickrSearchByPage = function(s, p, cb) {
	flickr.get("photos.search", {"tags":s, "per_page": 5, "page": p}, function(err, result){
	    if (err) return console.error(err);
	    photos = result.photos.photo;
	    var results = [];
	    var folder = slug(s);
	    var pages = result.photos.pages;
	    var total = result.photos.total;
	    flickrMgr[folder] = {photos: [], pages: pages, downloaded: 0, total: total};
	    console.log(pages);
	    for (var i=0; i<photos.length; i++) {
	    	results.push("https://farm"+photos[i].farm+".staticflickr.com/"+photos[i].server+"/"+photos[i].id+"_"+photos[i].secret+".jpg");

	    }
	    cb(results, folder);
	});
}

var flickrSearch = function(s, cb) {
	flickr.get("photos.search", {"tags":s, "per_page": 500}, function(err, result){
	    if (err) return console.error(err);
	    var pages = result.photos.pages;
	    for (var i=0; i<pages; i++) {
		    flickrSearchByPage(s, i, cb);
	    }
	});

}

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);  // close() is async, call cb after close completes.
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest); // Delete the file async. (But we don't check the result)
    if (cb) cb(err.message);
  });
};

var downloadPhotos = function(urls, folder) {
	for (var i=0; i<urls.length; i++) {
		var url = urls[i];
		var hash = crypto.createHash('md5').update(url).digest("hex");
		if (!fs.existsSync(folder)){
    		fs.mkdirSync(folder);
		}
		download(url, folder + "/" + hash + ".jpg", function() {
			flickrMgr[folder].downloaded += 1;
			console.log(flickrMgr[folder].downloaded);

		})

	}
}

flickrSearch("Eschscholzia Californica", downloadPhotos);
