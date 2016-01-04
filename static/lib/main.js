(function() {
	"use strict";

	window.WhoisinPlugin = {
		load: function(data) {
			socket.emit('plugins.whoisin.load', {
				url: data.url,
        pid: data.pid
			}, function(err, whoisin_data) {
				var participantsDiv = $('div#whoisin-' + data.pid + ' div.participants');
				var btnWrapper = 	$('div#whoisin-' + data.pid + ' div.whoisin-btn-wrapper');
				participantsDiv.html('');
				for (var i = 0; i < whoisin_data.users.length; i++) {
					var user = whoisin_data.users[i];
					if (user.isin) {
						participantsDiv.append(
							'<a class="whoisin-avatar-fix" href="/user/' + user.userslug + '">' +
							'<img data-original-title="' + user.username + '" src="' +
							user.picture + '" alt="' + user.username + '" class="whoisin-avatar"' +
							' title="">' + user.username + '</a>');
					}
				}

				participantsDiv.append('<br>');
				participantsDiv.append('Users Attending: ' + whoisin_data.users.length);
				participantsDiv.append('<br>');
				participantsDiv.append('<br>');

				if (!!whoisin_data.current_user_id) {
					if (whoisin_data.current_user_is_in) {
						btnWrapper.children('button.iamnotin').removeClass('hidden');
						btnWrapper.children('button.iamin').addClass('hidden');
					} else {
						btnWrapper.children('button.iamnotin').addClass('hidden');
						btnWrapper.children('button.iamin').removeClass('hidden');
					}
				} else {
					btnWrapper.children('button.iamnotin').addClass('hidden');
					btnWrapper.children('div.whoisin-btn-wrapper button.iamin').addClass('hidden');
				}
			});
		},
    setup: function(ev, data) {
			$('div.whoisin').each(function(key, el){
				var post_data = {};
				post_data.url = data.url;
				post_data.pid = el.getAttribute('data-pid');
				post_data.tid = data.url.match("topic/([0-9]*)")[1];

        // load existing users into whoisin widget
        WhoisinPlugin.load(post_data);

        // add currently logged in user when iamin button is tapped
        $('div#whoisin-' + post_data.pid +
				  ' div.whoisin-btn-wrapper button.iamin').on('click', function(e) {
          socket.emit('plugins.whoisin.commit', {
            url: post_data.url,
            pid: post_data.pid,
            action: 'add'
          }, function(err, result) {
            if (err) {
              console.log('Whoisin plugin: error submitting data to backend. ', err);
            } else {
              WhoisinPlugin.load(post_data);

							socket.emit('topics.follow', post_data.tid, function(err, result) {
								if(err) {
									console.log('Whoisin plugin: could not follow topic. ', err);
								} else if(!result) {
									// if result is false, means we unfollow the topic
									// so we send another request to follow
									socket.emit('topics.follow', post_data.tid);
								}
							});
            }
          });
        });

        // remove the current user from the whois in list
        $('div#whoisin-' + post_data.pid +
				  ' div.whoisin-btn-wrapper button.iamnotin').on('click', function(e) {
          bootbox.dialog({
          message: "You are about to remove yourself from the list",
          title: "You are no longer in?",
            buttons: {
              danger: {
                label: "Remove me!",
                className: "btn-danger",
                callback: function() {
                  socket.emit('plugins.whoisin.commit', {
                    url: post_data.url,
                    pid: post_data.pid,
                    action: 'remove'
                  }, function(err, result) {
                    if (err) {
                        // TODO: handle error
                    } else {
                        WhoisinPlugin.load(post_data);
                    }
                  });
                }
              },
              main: {
                label: "Cancel",
                className: "btn-primary",
                callback: function() {}
              }
            }
          });
        });
      });
    }
	};

	$(window).on('action:ajaxify.end', WhoisinPlugin.setup);
}());
