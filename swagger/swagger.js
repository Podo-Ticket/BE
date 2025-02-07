const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "포도티켓",
      description: "포도티켓 BE API Swagger UI",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:8080/",
        description: "Local Development",
      },
    ],
    tags: [
        {
            name: 'Play',
            description: '공연 정보',
        },
        {
            name: 'User',
            description: '예매자',
        },
        {
            name: 'Seat',
            description: '좌석',
        },
        {
            name: 'Ticket',
            description: '티켓',
        },
        {
            name: 'Survey',
            description: '서비스 평가',
        },
        {
            name: 'Reservation',
            description: '현장 예매',
        },
        {
            name: 'Admin',
            description: '관리자 접속',
        },
    ],
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'connect.sid',
            },
        },
    },
},
  security: 
  [
      {
          cookieAuth: [],
      },
  ],
  apis: ["./routes/*.js", "./swagger/*.yaml"],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
};