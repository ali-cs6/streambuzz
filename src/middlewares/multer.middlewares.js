import multer from "multer";

const uniqueSuffix = () => {
  const str = 'abcdefghijklmnopqrstuvwxyz';
  let unique = '';
  for (let i = 0; i < 5; i++) {
    const rand = Math.floor(Math.random() * 25);
    unique += str[rand]
  }
  return unique;
}

//first step -- storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname + '_' + uniqueSuffix())
  },
});


export const upload = multer({
  storage
})