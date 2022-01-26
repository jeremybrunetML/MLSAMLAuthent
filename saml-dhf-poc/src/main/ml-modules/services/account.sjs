function getRoles() {
	xdmp.log(xdmp.getCurrentUser())
	xdmp.log(xdmp.getCurrentRoles())
	let roles = []
	for (let role of xdmp.getCurrentRoles()) {
		roles.push(xdmp.roleName(role))
	}
	
	return roles
}


exports.GET = function (context, params) {
	let user = {
		login: xdmp.getCurrentUser(),
		roles: getRoles()
	}
	xdmp.log(user)
	return user
}

exports.DELETE = function (context, params) {
	xdmp.logout()
}