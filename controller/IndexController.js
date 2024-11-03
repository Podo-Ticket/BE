// main 화면
exports.index = async (req, res) => {
    try {
        res.send({ result: true, message: "Hello World!" }); // nfc 태그 시, 진입 가능
    } catch (err) {
        console.log(err);
    }
};