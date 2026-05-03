function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.rbac_role)) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { allowRoles };
