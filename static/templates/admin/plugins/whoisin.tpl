<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Who is in? | Admin Page</div>
			<div class="panel-body">
				<form role="form" class="whoisin-settings">
					<h2>About</h2>
					<p>This plugin provides a casual and easy way to ask users to RSVP
					or show their interest about a post.</p>
					<h3>Usage Examples</h3>
					<p>
						To use this plugin in a post just insert <code>[whoisin]</code>
						anywhere in a post. Here are some other examples of using the shortcode:
						
						The shortcode will be replaced by a simple list which users can add
						themselves to, or remove themselves.
					</p>
					<h3>Current Features</h3>
					<p>
						<ul>
							<li>One whoisin widget per post</li>
							<li>Abbility to add and remove yourself</li>
							<li>Allows custom title and button name in shortcode</li>
							<li></li>
						</ul>
					</p>
					<p>
						If you have a feature request please open an issue on
						<a href="https://github.com/arasbm/nodebb-plugin-whoisin/issues/new">
							the github repository
						</a> of this plugin.
					</p>
					<!--
					<div class="form-group">
						<label for="setting-whoisin-question">Question</label>
						<input type="text" id="setting-whoisin-question" name="setting-whoisin-question" title="Who is in question" class="form-control" placeholder="Who is in?"><br />
					</div>
					<div class="form-group">
						<label for="setting-whoisin-response">Response</label>
						<input type="text" id="setting-whoisin-response" name="setting-whoisin-response" title="Who is in response" class="form-control" placeholder="I am in!"><br />
					</div>
					-->
				</form>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<script>
	require(['settings'], function(Settings) {
		Settings.load('whoisin', $('.whoisin-settings'));

		$('#save').on('click', function() {
			Settings.save('whoisin', $('.whoisin-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'whoisin-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply new whoisin settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				})
			});
		});
	});
</script>
