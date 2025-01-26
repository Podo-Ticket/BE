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
    components: {
        securitySchemes: {
            cookieAuth: {
                type: 'apiKey',
                in: 'cookie',
                name: 'session_ID',
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