(function(module) {
"use strict";

//var USER = require('../../src/user');

var whoisin = {},
		SocketPlugins = module.parent.require('./socket.io/plugins'),
		db = module.parent.require('./database'),
	  meta = module.parent.require('./meta'),
		user = module.parent.require('./user'),
		// posts = module.parent.require('./posts'),
		mainTemplate =
		// TODO: get from'/templates/views/main';
		'<div class="whoisin">' +
		'  <h4>Who is in?</h4>' +
		'	<div class="participants"></div>' +
		'  <div class="whoisin-btn-wrapper">' +
		' 	<button title="add yourself to the list" class="iamin btn btn-primary">' +
		' 		<i class="fa fa-plus"></i> I am in!</button>' +
		' 	<button title="remove yourself from this list" class="iamnotin btn btn-danger">' +
		' 		<i class="fa fa-times"></i></button>' +
		'	</div>' +
		'</div>' +
		'<br />',
		  idInput = '<input type="hidden" class="whoisin-id" style="display:none;" value="{{id}}" />';

whoisin.init = function(app, middleware, controllers, callback) {
	console.log('nodebb-plugin-whoisin: loaded');
	console.log('configs ------------------> ', meta.config);

	// We create two routes for every view. One API call, and the actual route itself.
	// Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.
	app.get('/admin/plugins/whoisin', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/whoisin', renderAdmin);

	SocketPlugins.whoisin = {
		commit: whoisin.commit,
		load: whoisin.load
	};

	callback();
};

whoisin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/plugins/whoisin',
		icon: 'fa-child',
		name: 'whoisin'
	});

	callback(null, header);
};

whoisin.parse = function(postContent, callback) {
		postContent = postContent.replace(/Who is in\?/gi, mainTemplate);
		callback(null, postContent);
};

whoisin.commit = function(socket, data, callback) {
	if (socket.hasOwnProperty('uid') && socket.uid > 0) {
		var topicid = data.id || data.url.match("topic/([0-9]*)")[1];
		db.getObject('whoisin-post-' + topicid + '-participants', function(err, whoisin_participants) {
			if (err) {
				console.log('whoisin plugin: noone is in');
			}
			whoisin_participants = whoisin_participants || {};
			if (data.action === 'add') {
				whoisin_participants[socket.uid] = {
					isin: true,
					timestamp: new Date()
				};
			} else if (data.action === 'remove' && whoisin_participants[socket.uid]) {
				whoisin_participants[socket.uid].isin = false;
			}
			//serialize
			whoisin_participants[socket.uid] = JSON.stringify(whoisin_participants[socket.uid]);

			db.setObject('whoisin-post-' + topicid + '-participants', whoisin_participants, function(err){
				if (err) {
					console.log('Whoisin Plugin: Error saving to db, ', err);
				} else {
					callback(null, "success");
				}
			});
		});
	} else {
		callback(new Error('not-logged-in'));
	}
}

whoisin.load = function(socket, data, callback) {
	var topicid = data.id || data.url.match("topic/([0-9]*)")[1];

	db.getObject('whoisin-post-' + topicid + '-participants', function(err, participants) {
		var users_array = [];
		var whoisin_data = {};
		if (err) {
			console.log('whoisin plugin: Error getting list of participants for topic');
		}
		whoisin_data.current_user_is_in = false;
		whoisin_data.current_user_id = socket.uid;
		whoisin_data.users = participants;
		for (var userid in whoisin_data.users) {
			// FIXME
			whoisin_data.users[userid] = JSON.parse(whoisin_data.users[userid]);

			users_array.push(userid);
			if (userid == socket.uid && whoisin_data.users[userid].isin) {
				whoisin_data.current_user_is_in = true;
			}
		}
		user.getMultipleUserFields(users_array, ['username', 'userslug', 'picture', 'uid'], function(err, users_data) {
			// Add user data to whoisin data
			
			var sortable = [], user;
			
			for (var id in users_data) {
				user = users_data[id];
				whoisin_data.users[user.uid].userslug = user.userslug;
				whoisin_data.users[user.uid].picture = user.picture;
				// for (var prop in user) {
				// 	whoisin_data.users[user.uid][prop] = user[prop];
				// }
			}
			
			for (user in whoisin_data.users){
				if(whoisin_data.users.hasOwnProperty(user)){
					var u = whoisin_data.users[user];
					u.uid = user;
					sortable.push(u);
				}
			}
			
			whoisin_data.users = sortable.sort(function(a,b){
				var an = new Date(a.timestamp),
					bn = new Date(b.timestamp);
				
				if(an > bn || b.uid == socket.uid) {
					return 1;
				}
				if(an < bn || a.uid == socket.uid) {
					return -1;
				}
				return 0;
			});
			
			callback(null, whoisin_data);
		});
	});
}

function renderAdmin(req, res, next) {
	res.render('admin/plugins/whoisin', {});
}

whoisin.include = function(id, callback){
	
  var html = mainTemplate + idInput.replace("{{id}}", id);

  if(callback) { callback(null, html); }

  return html;
}
  
module.exports = whoisin;

}(module));
