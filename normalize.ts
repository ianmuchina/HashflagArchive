import type { Campaign } from "./main.ts";
// Map of campaigns to hashtags with asseturl & expiry
let CampaignMap: Record<string, Campaign> = JSON.parse(
    Deno.readTextFileSync("data/campaigns.json"),
);
// Map of hashtags to campaigns
let HashtagMap: Record<string, Array<string>> = JSON.parse(
    Deno.readTextFileSync("data/hashtags.json"),
);

Object.keys(CampaignMap).forEach( c => {
    CampaignMap[c].hashTags = []
})

Object.keys(HashtagMap).forEach(hashtag => {
    HashtagMap[hashtag].forEach(c => {
        CampaignMap[c].hashTags.push(hashtag)
    });
})

await Deno.writeTextFile(
    "data/campaigns.json",
    JSON.stringify(CampaignMap, null, "\t"),
  );