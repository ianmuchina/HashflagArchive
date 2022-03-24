package main

import (
	_ "embed"
	"encoding/json"
	"os"
	"path"
)

type Campaign struct {
	AssetUrl            string `json:"assetUrl"`
	StartingTimestampMs string `json:"startingTimestampMs"`
	EndingTimestampMs   string `json:"endingTimestampMs"`
}

type Hashtag struct {
	Campaigns []string
}

type RawData struct {
	Campaign
	CampaignName string `json:"campaignName"`
	Hashtag      string `json:"hashtag"`
}

func main() {

	campaigns := make(map[string]Campaign, 3000)
	hashtags := make(map[string][]string, 3000)

	c, _ := os.ReadFile("data/campaigns.json")
	h, _ := os.ReadFile("data/hashtags.json")
	json.Unmarshal(c, &campaigns)
	json.Unmarshal(h, &hashtags)

	dir := "tmp/"

	res := []RawData{}
	files, _ := os.ReadDir(dir)

	for _, file := range files {
		// Open file
		data, _ := os.ReadFile(path.Join(dir, file.Name()))
		// Decode json
		json.Unmarshal([]byte(data), &res)

		for _, r := range res {
			// If campaign is not in map
			if _, ok := campaigns[r.CampaignName]; !ok {
				c := Campaign{
					AssetUrl:            r.AssetUrl,
					EndingTimestampMs:   r.EndingTimestampMs,
					StartingTimestampMs: r.StartingTimestampMs,
				}
				campaigns[r.CampaignName] = c

				// New hashtag
				if _, ok := hashtags[r.Hashtag]; !ok {
					hashtags[r.Hashtag] = []string{r.CampaignName}
				} else {
					// reuse hashtag
					hashtags[r.Hashtag] = append(hashtags[r.Hashtag], r.CampaignName)
				}

			}
		}
	}

	campaigns_fmt, _ := json.MarshalIndent(campaigns, "", "\t")
	hashtags_fmt, _ := json.MarshalIndent(hashtags, "", "\t")

	os.WriteFile("data/hashtags.json", hashtags_fmt, 0644)
	os.WriteFile("data/campaigns.json", campaigns_fmt, 0644)
}
