const AuditLog = require('../models/AuditLog');

// Use as a manual helper or automatic middleware
// To use as middleware on a route like DELETE /admin/post/:id
// router.delete('/posts/:id', auth, adminOnly, audit('delete_post', 'Post', (req) => req.params.id), ...)
const audit = (action, targetType, getTargetId = (req) => req.params.id) => {
  return async (req, res, next) => {
    // We wrap the original res.json to log only IF the request succeeded
    const oldJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const targetId = typeof getTargetId === 'function' ? getTargetId(req) : null;
        const rawIp = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
        
        AuditLog.create({
          userId: req.userId,
          action,
          targetType,
          targetId: (targetId && String(targetId).length === 24) ? targetId : null,
          details: { 
            body: req.body, 
            params: req.params,
            query: req.query,
            response: data?.message || '(Success)'
          },
          ip: rawIp,
          userAgent: req.headers['user-agent']
        }).catch(err => console.error('Audit logic error:', err));
      }
      return oldJson.apply(res, arguments);
    };
    next();
  };
};

module.exports = audit;
