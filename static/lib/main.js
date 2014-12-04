(function() {
	"use strict";

	window.WhoisinPlugin = {
        id: "",
		load: function(data) {
			socket.emit('plugins.whoisin.load', {
				url: data.url,
                id: WhoisinPlugin.id
			}, function(err, whoisin_data) {
				var participantsDiv = $('div.participants');
				participantsDiv.html('');
				for (var i = 0; i < whoisin_data.users.length; i++) {
					var user = whoisin_data.users[i];
					if (user.isin) {
						participantsDiv.append(
							'<a href="/user/' + user.userslug + '">' +
							'<img data-original-title="' + user.username + '" src="' +
							user.picture + '" alt="' + user.username + '" class="whoisin-avatar"' +
							' title=""></a>');
					}
				}
				if (!!whoisin_data.current_user_id) {
					if (whoisin_data.current_user_is_in) {
						$('div.whoisin-btn-wrapper button.iamnotin').removeClass('hidden')
						$('div.whoisin-btn-wrapper button.iamin').addClass('hidden')
					} else {
						$('div.whoisin-btn-wrapper button.iamnotin').addClass('hidden')
						$('div.whoisin-btn-wrapper button.iamin').removeClass('hidden')
					}
				} else {
					$('div.whoisin-btn-wrapper button.iamnotin').addClass('hidden')
					$('div.whoisin-btn-wrapper button.iamin').addClass('hidden')
				}
			});
		},
        setup: function(ev, data) {
            data = data || {};
            data.id = WhoisinPlugin.id = $(".whoisin-id").val();
            if (data.id || /^topic\/[\d]+/.test(data.url)) {
                // load existing users into whoisin widget
                WhoisinPlugin.load(data);
                // add currently logged in user when iamin button is tapped
                $('div.whoisin-btn-wrapper button.iamin').on('click', function(e) {
                    socket.emit('plugins.whoisin.commit', {
                        url: data.url,
                        id: data.id,
                        action: 'add'
                    }, function(err, result) {
                        if (err) {
                            // TODO: handle error
                        } else {
                            WhoisinPlugin.load(data);
                        }
                    });
                });

                // remove the current user from the whois in list
                $('div.whoisin-btn-wrapper button.iamnotin').on('click', function(e) {
                    bootbox.dialog({
                    message: "You are about to remove yourself from the list",
                    title: "You are no longer in?",
                        buttons: {
                            danger: {
                                label: "Remove me!",
                                className: "btn-danger",
                                callback: function() {
                                    socket.emit('plugins.whoisin.commit', {
                                        url: data.url,
                                        id: data.id,
                                        action: 'remove'
                                    }, function(err, result) {
                                        if (err) {
                                            // TODO: handle error
                                        } else {
                                            WhoisinPlugin.load(data);
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
            }
       }
	};

	$(window).on('action:ajaxify.end', WhoisinPlugin.setup);
}());
