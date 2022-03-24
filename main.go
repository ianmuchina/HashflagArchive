package main

import (
	"encoding/json"
	"os"
	"path"
	"strings"
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
			// New campaign
			if _, ok := campaigns[r.CampaignName]; !ok {

				// Create campaign entry
				campaigns[r.CampaignName] = Campaign{
					AssetUrl:            r.AssetUrl,
					EndingTimestampMs:   r.EndingTimestampMs,
					StartingTimestampMs: r.StartingTimestampMs,
				}

			}

			// Change case
			r.Hashtag = strings.ToLower(r.Hashtag)
			// New Hashtag
			if _, ok := hashtags[r.Hashtag]; !ok {
				// New hashtag
				hashtags[r.Hashtag] = []string{r.CampaignName}
			} else {
				// if hashtag has campaign
				exists := false
				for _, cs := range hashtags[r.Hashtag] {
					// If hashtag has campaign
					if cs == r.CampaignName {
						exists = true
					}
				}

				// Campaign not in hashtag map
				if !exists {
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
