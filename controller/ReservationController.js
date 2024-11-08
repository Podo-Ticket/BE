exports.reservation = async (req, res) => {
    try {
        const { name, phoneNumber, headCount, playId, scheduleId } = req.body;

        res.send({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};