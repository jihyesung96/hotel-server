//common js 구문
//모듈 import ----> require("모듈")
//express
const express = require("express")
const cors = require("cors");
const mysql = require("mysql");
const multer = require("multer");
const bcrypt = require('bcrypt');
const saltRounds = 10;

//서버 생성
const app = express();

//프로세서의 주소 포트번호 지정
const port = 8080 ;

//브라우저의 cors이슈를 막기 위해 사용
app.use(cors());

//json형식의 데이터를 처리하도록 설정
app.use(express.json());

//upload폴더 클라이언트에서 접근 가능하도록 설정
app.use("/upload",express.static("upload"));

//storage 생성
const storage = multer.diskStorage({
    destination: (req , file, cd)=>{
        cd(null, 'upload/event');
    },
    filename : (req , file, cd) => {
        cd(null, newFilename)
    }
})

//upload 객체  생성하기
const upload = multer({ storage : storage });

//upload경로로 post요청시 응답 구현하기
app.post("/upload",upload.single("file"), (req,res)=>{
    res.send({
        imageUrl : req.file.filename
    })
})

//mysql연결하기
const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password : "1234",
    port: "3306",
    database: "hotel"
})
conn.connect();

//get요청 
app.get("/special",(req,res)=>{
    //conn.query("쿼리문",콜백함수)
    conn.query("select * from event where e_category = 'special'",
    (error, result, fields)=>{ 
        res.send(result);
    })
})
//http://localhost:8080/special/1
app.get("/special/:no",(req,res)=>{
    const {no} = req.params;
    conn.query(`select * from event where e_category = 'special' and e_no=${no}`,
    (error, result,fields) => {
        res.send(result);
    })
})

//회원가입 요청
app.post("/join", async (req,res) => {
    //입력받은 비밀번호 mytextpass로 활당
   const mytextpass = req.body.m_pass;
   let myPass = "";
   const{m_name,m_pass,m_nickname,m_phone,m_add1,m_add2,m_email} =req.body;
   console.log(req.body);
   //빈 문자열이 아니고 undefined가 아닐때
   if(mytextpass != '' && mytextpass != undefined){
    bcrypt.genSalt(saltRounds, function(err, salt) {
        //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여
        //콜백함수 안 hash로 돌려준다.
        bcrypt.hash(mytextpass, salt, function(err, hash) {
            myPass = hash;
            console.log(myPass);
            //쿼리 작성
            conn.query(`insert into member(m_name, m_pass, m_phone, m_nickname, m_address1, m_address2,m_email)
            values('${m_name}','${myPass}','${m_phone}','${m_nickname}','${m_add1}','${m_add2}','${m_email}')
            `,(err , result , fields)=>{
                if(result){
                    res.send("등록되었습니다.");
                }
            })
        });
    });
   }
   //insert into member (m_name, m_pass, m_phone, m_nickname, m_add1, m-add2)
   //vlues(${})
   
})

//로그인 요청
app.post("/login",async (req,res) => {
    //useremail값에 일치하는 데이터가 있는지 확인
    //userpass 암호화해서 쿼리 결과의 패스워드랑 일치라는지 체크
    const { useremail , userpass } = req.body;
    conn.query(`select * from member where m_email = '${useremail}'`,
    (err,result,fields)=>{
        if(result != undefined && result[0] != undefined){
            bcrypt.compare(userpass, result[0].m_pass, function(err,rese){
                //result == true 
                if(rese){
                    console.log("로그인 성공");
                    res.send(result);
                }else{ 
                    console.log("로그인 실패");
                    res.send("실패");
                }
            })
        }else{
            console.log("데이터가 없습니다.");
        }
    })
})

//아이디 찾기 요청 (요청req 응답res)
app.post("/findid",async (req,res)=>{
    const{ m_name , m_phone } = req.body;
    conn.query(`select * from member where m_name = '${m_name}' and m_phone = '${m_phone}'`,(err, result, fields)=>{
        if(result){
            console.log(result[0].m_email);
            res.send(result[0].m_email);
        }
        console.log(err);
    })//(err, result, fields)순차적으로 받아오는 콜백함수 만들어져있는거임!
})

//비밀번호 찾기 요청
app.post("/findpass",async(req,res) => {
    const { m_name, m_email } = req.body;
    conn.query(`select * from member where m_name = '${m_name}' and m_email = '${m_email}'`,(err,result,fields)=>{
        if(result){
            res.send(result[0].m_email);
        }
        console.log(err);
    })
})

//패스워드 변경 요청
app.patch("/updatePw" ,(req,res)=>{
    const { m_pass , m_email } = req.body;
    //update 테이블 이름
    //set 필드이름 = 데이터 값
    //where 조건절 update member set m_pass
    const mytextpass = m_pass;
    let myPass = "";
    if(mytextpass != '' && mytextpass != undefined){
        bcrypt.genSalt(saltRounds, function(err, salt) {
            //hash메소드 호출되면 인자로 넣어준 비밀번호를 암호화하여
            //콜백함수 안 hash로 돌려준다.
            bcrypt.hash(mytextpass, salt, function(err, hash) {
                myPass = hash;
                //쿼리 작성
                conn.query(`update member set m_pass='${myPass}' where m_email='${m_email}' 
                `,(err , result , fields)=>{
                    if(result){
                        res.send("등록되었습니다.");
                        console.log(result);
                    }
                    console.log(err);
                })
            });
        });
    }
})

//서버를 구동 
app.listen(port, ()=>{
    console.log("서버가 동작하고 있습니다.");
})