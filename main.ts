export type RawHashflag = {
  hashtag: string;
  starting_timestamp_ms: number;
  ending_timestamp_ms: number;
  asset_url: string;
  campaign: string;
  is_hashfetti_enabled?: boolean;
};

export type Campaign = {
  assetUrl: string;
  startingTimestampMs: number;
  endingTimestampMs: number;
  hashTags: Array<string>;
};

export type hashflags_io = {
  hashtags: Array<string>;
  startsAt: number;
  endsAt: number;
  isAnimated: boolean;
};

// Fetch new hashflags
// Generates valid headers for use in undocumented but public twitter apis
async function genHeaders() {
  const url = "https://api.twitter.com/1.1/guest/activate.json";
  const bearer =
    "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${bearer}` },
  });
  const json = await response.json();

  return {
    "Authorization": `Bearer ${bearer}`,
    "X-Guest-Token": json.guest_token,
  };
}

async function sha256(message: string) {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // convert bytes to hex string
  return hashHex;
}

// Fetch latest hashflags from twitter api
async function fetchTwitterHashflags(): Promise<RawHashflag[]> {
  let data = [];
  // Temporary Cache. Should be in gitignore
  // let cacheFile = "data/cache_twitter_api_hashflags.json";
  // try {
  //   data = JSON.parse(Deno.readTextFileSync(cacheFile));
  // } catch {
  const url = "https://api.twitter.com/1.1/hashflags.json";
  const response = await fetch(url, {
    method: "GET",
    headers: await genHeaders(),
  });
  data = await response.json();
  // Deno.writeTextFileSync(cacheFile, JSON.stringify(data));
  // } finally {
  return data;
  // }
}

//  Latest hashflags from twitter
async function convertTwitterHashFlags() {
  const activeHashflags = await fetchTwitterHashflags();
  console.log(typeof activeHashflags)
  console.log(activeHashflags.length)
  // Generate campaign name.
  // NOTE: asssumes common url structure. Could be wrong
  activeHashflags.forEach((v, i) => {
    console.log(key)
    activeHashflags[i].campaign = v.asset_url.split("/")[4];
    activeHashflags[i].hashtag = activeHashflags[i].hashtag.toLowerCase();
  });

  activeHashflags.forEach((t) => {
    if (Object.keys(CampaignMap).includes(t.campaign) == false) {
      new_campaigns.push(t.campaign);
      CampaignMap[t.campaign] = {
        assetUrl: t.asset_url,
        startingTimestampMs: t.starting_timestamp_ms,
        endingTimestampMs: t.ending_timestamp_ms,
        hashTags: [],
      };
    }
  });

  // Populate hashtag list
  activeHashflags.forEach((t) => {
    if (Object.keys(CampaignMap).includes(t.campaign)) {
      // If campaign does not include the hashtag,
      if (CampaignMap[t.campaign].hashTags.includes(t.hashtag) == false) {
        // Append to campaign list.
        CampaignMap[t.campaign].hashTags.push(t.hashtag);
      }
    }
  });

  // Populate hashtag map
  activeHashflags.forEach((t) => {
    // if hashtag is already listed
    if (HashtagMap[t.hashtag]) {
      // if not listed, append campaign name
      if (HashtagMap[t.hashtag].includes(t.campaign) == false) {
        HashtagMap[t.hashtag].push(t.campaign);
      }
    } else {
      // new entry
      HashtagMap[t.hashtag] = [t.campaign];
    }
  });
}
// Get Data from Hashflags IO
// TODO: Regression tests for schema changes in https://hashflags.io/hashflags
// TODO: Error Checks
// TODO: animations
async function fetchHashFlagsIO() {
  // Cache file. Should be in .gitignore. Useful for fast local dev
  let hashflagsIO: Record<string, hashflags_io> = {};
  // const cache = "data/cache_hashflags_io.json"

  // try {
  //   // Load from local cache
  //   hashflagsIO = JSON.parse(await Deno.readTextFile(cache));
  // } catch {
  // Fetch Data from hashflags.io
  const response = await fetch("https://hashflags.io/hashflags");
  // Parse body as json
  const json = await response.json();
  // Format json and use tabs
  const jsonStr = JSON.stringify(json, null, "\t");
  // Persist data to cache file
  // TODO: Maybe Use LocalStorage()
  // Deno.writeTextFileSync(cache, jsonStr)
  // Write Object
  hashflagsIO = json;
  // } finally {
  return hashflagsIO;
  // }
}

// Convert hashflags.io data to other format
async function convertHashflagsIO() {
  // Result is a map of campaign images to hashtags and validity
  const hashflagsIO = await fetchHashFlagsIO();

  const encoder = new TextEncoder();
  for (const key of Object.keys(hashflagsIO)) {
    let val = hashflagsIO[key];
    // Usualy an image url.
    let campaign = key;

    // Set Readable Campaign Name if image is from twitter cdn
    // TODO: Regression testing
    // TODO: Manual Overrides
    if (key.startsWith("https://abs.twimg.com/hashflags/")) {
      campaign = key.split("/")[4];
    
    } else {
      campaign = await sha256(campaign);
    }

    if (!CampaignMap[campaign]) {
      new_campaigns.push(campaign);
    }

    // Iterate over all hashtags in campaign
    val.hashtags.forEach((hashtag) => {
      // Normalize to lowercase
      hashtag = hashtag.toLowerCase();
      // append if not included
      // If Campaign exists but doesn't have hashtag
      if (
        (CampaignMap[campaign]) &&
        (CampaignMap[campaign].hashTags.includes(hashtag) == false)
      ) {
        // Append hashtag
        CampaignMap[campaign].hashTags.push(hashtag);
      } else {
        // If Campaign Does not exist, create it and append hashtags
        CampaignMap[campaign] = {
          assetUrl: key,
          startingTimestampMs: val.startsAt,
          endingTimestampMs: val.endsAt,
          // Append Hashtags
          hashTags: val.hashtags,
        };
      }
    });

    // Add new hashtags to the local hashtag map
    val.hashtags.forEach((hashtag) => {
      hashtag = hashtag.toLowerCase();
      if (HashtagMap[hashtag]) {
        if (HashtagMap[hashtag].includes(campaign) == false) {
          HashtagMap[hashtag].push(campaign);
        }
      } else {
        // hashtag is new & not in map
        HashtagMap[hashtag] = [campaign];
      }
    });
  }
}



// Map of campaigns to hashtags with asseturl & expiry
let CampaignMap: Record<string, Campaign> = JSON.parse(
  Deno.readTextFileSync("data/campaigns.json"),
);
// Map of hashtags to campaigns
let HashtagMap: Record<string, Array<string>> = JSON.parse(
  Deno.readTextFileSync("data/hashtags.json"),
);

Object.keys(HashtagMap).forEach(hashtag => {
  HashtagMap[hashtag].forEach(c => {
    CampaignMap[c].hashTags.push()
  });
})
let new_campaigns: Array<string> = [];
let new_hashtags: Array<string> = [];

await convertTwitterHashFlags();
// await convertHashflagsIO();

// List of image assets to download
const all_urls: Array<string> = Object.values(CampaignMap).map((c) =>
  c.assetUrl
);
const new_urls: Array<string> = [];

new_campaigns.forEach((c) => {
  new_hashtags = new_hashtags.concat(CampaignMap[c].hashTags);
  new_urls.push(CampaignMap[c].assetUrl);
});


// Save downloaded json to file
async function PersistData() {
  // List of campaigns
  await Deno.writeTextFile(
    "data/campaigns.json",
    JSON.stringify(CampaignMap, null, "\t"),
  );
  // List of hastags
  await Deno.writeTextFile(
    "data/hashtags.json",
    JSON.stringify(HashtagMap, null, "\t"),
  );

  // Commit Message
  await Deno.writeTextFile(
    "tmp/commit_msg",
    `Added ${new_campaigns.length} Campaigns and ${new_hashtags.length} new hashtags`,
  );
  await Deno.writeTextFile("tmp/new_urls", new_urls.join("\r\n"));
  await Deno.writeTextFile("tmp/all_urls", all_urls.join("\r\n"));
}

await PersistData();
