const isAdmin = (req, res, next) => {
    if (req.session.admin)
        return next();
    else
        return res.status(401).json({ error: '관리자 권한이 필요합니다.' });
}

module.exports = isAdmin;