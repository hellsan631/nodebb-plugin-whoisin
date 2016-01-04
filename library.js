(function(module) {
"use strict";
var whoisin = {},
		SocketPlugins = module.parent.require('./socket.io/plugins'),
		db = module.parent.require('./database'),
	  meta = module.parent.require('./meta'),
		user = module.parent.require('./user'),
		// posts = module.parent.require('./posts'),
		mainTemplate =
		'<div id="whoisin-{postData.pid}" class="whoisin" data-pid="{postData.pid}">' +
		'  <h4>{title}</h4>' +
		'	<div class="participants"></div>' +
		'  <div class="whoisin-btn-wrapper">' +
		' 	<button title="add yourself to the list" class="iamin btn btn-primary">' +
		' 		<i class="fa fa-plus"></i> {iamin}</button>' +
		' 	<button title="remove yourself from this list" class="iamnotin btn btn-danger">' +
		' 		<i class="fa fa-times"></i></button>' +
		'	</div>' +
		'</div>' +
		'<br />';

whoisin.init = function(params, callback) {
	// We create two routes for every view. One API call, and the actual route itself.
	// Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.
	params.router.get('/admin/plugins/whoisin', params.middleware.admin.buildHeader, renderAdmin);
	params.router.get('/api/admin/plugins/whoisin', renderAdmin);

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

whoisin.parse = function(data, callback) {
	if (data && data.postData && data.postData.content) {
		var settings = /(\[whoisin )(.*)(\])/.exec(data.postData.content);
		var title = "Who is in?";
		var iamin = "I am in!";
		if (!!settings && settings.length > 2) {
			var title_attr = /(title=\()(.*?)(\))/.exec(settings[2]);
			var iamin_attr = /(iamin=\()(.*?)(\))/.exec(settings[2]);
			if (title_attr) {
				title = title_attr[2];
			}
			if (iamin_attr) {
				iamin = iamin_attr[2];
			}
		}
		var tmp =
			mainTemplate.replace(/\{postData.pid\}/gi, data.postData.pid)
			.replace(/\{title\}/gi, title)
			.replace(/\{iamin\}/gi, iamin);
		data.postData.content =
		  data.postData.content.replace(/\[whoisin(.*?)\]/gi, tmp);
	}
	callback(null, data);
};

whoisin.commit = function(socket, data, callback) {
	if (socket.hasOwnProperty('uid') && socket.uid > 0) {
		db.getObject('whoisin-post-' + data.pid + '-participants', function(err, whoisin_participants) {
			if (err) {
				console.log('whoisin plugin: noone is in');
			}

			whoisin_participants = whoisin_participants || {};

			var participants;

			if(typeof whoisin_participants === 'string') {
				whoisin_participants = JSON.parse(whoisin_participants);
			}

			participants = JSON.parse(JSON.stringify(whoisin_participants));

			try {
				if (data.action === 'add') {
					participants[socket.uid] = {
						isin: true,
						timestamp: new Date()
					};
				} else if (data.action === 'remove' && participants[socket.uid]) {
					participants[socket.uid] = {
						isin: false,
						timestamp: participants[socket.uid].timestamp
					};
				}
			} catch(e) {
				console.error('an error setting participants occured', e);
				return callback(e);
			}


			//serialize
			participants[socket.uid] = JSON.stringify(participants[socket.uid]);

			db.setObject('whoisin-post-' + data.pid + '-participants', participants, function(err){
				if (err) {
					return console.log('Whoisin Plugin: Error saving to db, ', err);
				} callback(null, 'success');
			});
		});
	} else {
		callback(new Error('not-logged-in'));
	}
};

whoisin.load = function(socket, data, callback) {
	db.getObject('whoisin-post-' + data.pid + '-participants', function(err, participants) {
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
		user.getUsersFields(users_array, ['username', 'userslug', 'picture', 'uid'], function(err, users_data) {
			// Add user data to whoisin data
			var sortable = [], user;

			for (var id in users_data) {
				user = users_data[id];
				whoisin_data.users[user.uid].userslug = user.userslug;
				whoisin_data.users[user.uid].picture = user.picture;
				whoisin_data.users[user.uid].username = user.username;
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
};

function renderAdmin(req, res, next) {
	res.render('admin/plugins/whoisin', {});
}

module.exports = whoisin;

}(module));
