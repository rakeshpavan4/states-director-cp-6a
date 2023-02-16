const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("server running"));
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertDbObjectToResponseObject = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};
const convertDbObjectToResponseObject2 = (eachState) => {
  return {
    districtId: eachState.district_id,
    districtName: eachState.district_name,
    stateId: eachState.state_id,
    cases: eachState.cases,
    cured: eachState.cured,
    active: eachState.active,
    deaths: eachState.deaths,
  };
};

//API GET

app.get("/states/", async (request, response) => {
  const getAllStates = `
    SELECT 
    *
     FROM 
     state;`;
  const statesArray = await database.all(getAllStates);
  response.send(
    statesArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getAllStates = `
    SELECT 
    *
     FROM 
     state
     WHERE
     state_id=${stateId};`;
  const statesArray = await database.get(getAllStates);
  response.send(convertDbObjectToResponseObject(statesArray));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const getAllDistrict = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES 
  ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const districtArray = await database.run(getAllDistrict);
  response.send("District Successfully Added");
});
//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await database.get(getDistrictsQuery);
  response.send(convertDbObjectToResponseObject2(district));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deletePlayerQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deletePlayerQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updatePlayerQuery = `
  UPDATE
    district
  SET
   district_name='${districtName}',
   state_id=${stateId},
   cases=${cases},
   cured=${cured},
    active=${active},
   deaths=${deaths}
  WHERE
    district_id = ${districtId};`;

  await database.run(updatePlayerQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getAllStates = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
     FROM 
        district
     WHERE
     state_id=${stateId};`;
  const stats = await database.get(getAllStates);
  //console.log(stats);

  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`; //With this we will get the state_id using district table
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};
`; //With this we will get state_name as stateName using the state_id
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
}); //sending the required response
module.exports = app;
