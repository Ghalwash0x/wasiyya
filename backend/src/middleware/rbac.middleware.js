const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'غير مصرح'
            });
        }

        // Developer has implicit access everywhere admin is allowed
        const effective = req.user.role === 'developer' && allowedRoles.includes('admin')
            ? [...allowedRoles, 'developer']
            : allowedRoles;

        if (!effective.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول لهذا المورد'
            });
        }

        next();
    };
};

module.exports = { authorize };
