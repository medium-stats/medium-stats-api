const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 80;

app.use(cors());

const MEDIUM = "https://medium.com";
const JSON_PREFIX = "])}while(1);</x>";

const cleanResponse = (response) =>
  JSON.parse(response.replace(JSON_PREFIX, ""));

app.get("/user", (req, res) => {
  const { username } = req.query;

  return axios
    .get(`${MEDIUM}/@${username}?format=json`)
    .then((result) => res.send(cleanResponse(result.data).payload.user))
    .catch((error) => console.error(error) && res.send(400));
});

/* Get all data from a paginated endpoint */
const getAllDataForUri = async (uri) => {
  // e.g. url = /_/api/users/userId/following
  let url = MEDIUM + uri + "?limit=100";
  let data = [];
  let isEnd = false;
  let nextId;

  while (!isEnd) {
    if (nextId) {
      url = MEDIUM + uri + "?limit=100&to=" + nextId;
    }

    const response = await axios.get(url);
    const { payload } = cleanResponse(response.data);
    data = [...data, ...payload.value];

    if (
      payload &&
      payload.paging &&
      payload.paging.next &&
      payload.paging.next.to
    ) {
      nextId = payload.paging.next.to;
    } else {
      isEnd = true;
    }
  }

  return data;
};

const getFollowings = async (userId) => {
  return getAllDataForUri("/_/api/users/" + userId + "/following");
};

const getFollowers = async (userId) => {
  return getAllDataForUri("/_/api/users/" + userId + "/followers");
};

app.get("/followings", (req, res) => {
  const { userId } = req.query;

  getFollowings(userId)
    .then((followings) => res.send(followings))
    .catch((error) => console.error(error) && res.sendStatus(400));
});

app.get("/followers", (req, res) => {
  const { userId } = req.query;

  getFollowers(userId)
    .then((followers) => res.send(followers))
    .catch((error) => console.error(error) && res.sendStatus(400));
});

app.listen(port, () => {
  console.log(`Medium stats api listening on port ${port}`);
});
