package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path"
	"sort"
	"strings"
)

// Structure of data/campaigns.json
type Campaign struct {
	AssetUrl            string `json:"assetUrl"`
	StartingTimestampMs string `json:"startingTimestampMs"`
	EndingTimestampMs   string `json:"endingTimestampMs"`
}

// structure of data/hashtags.json
type Hashtag struct {
	Campaigns []string
}

// Structure of twitter's unofficial API
type RawData struct {
	Campaign
	CampaignName string `json:"campaignName"`
	Hashtag      string `json:"hashtag"`
}

// Structure of data from hashflags.io
type hashflagsIo struct {
	CampaignName string
	AssetUrl     string
	StartsAt     int64    `json:"startsAt"`
	EndsAt       int64    `json:"endsAt"`
	Hashtags     []string `json:"hashtags"`
}

func main() {

	campaigns := make(map[string]Campaign, 9000)
	hashtags := make(map[string][]string, 9000)

	c, _ := os.ReadFile("data/campaigns.json")
	json.Unmarshal(c, &campaigns)

	h, _ := os.ReadFile("data/hashtags.json")
	json.Unmarshal(h, &hashtags)

	// Directory where data from the twitter api is stored
	dir := "tmp/"

	// used to make commit message
	var new_campaigns []string
	var new_hashtags []string

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
				// append campaign to list of new campaigns
				new_campaigns = append(new_campaigns, r.CampaignName)
			}

			// Change case
			r.Hashtag = strings.ToLower(r.Hashtag)
			// New Hashtag
			if _, ok := hashtags[r.Hashtag]; !ok {
				// New hashtag
				hashtags[r.Hashtag] = []string{r.CampaignName}
				new_hashtags = append(new_hashtags, r.Hashtag)
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
					new_hashtags = append(new_hashtags, r.Hashtag)
				}
			}
		}
	}

	// Write files
	campaigns_fmt, _ := json.MarshalIndent(campaigns, "", "\t")
	hashtags_fmt, _ := json.MarshalIndent(hashtags, "", "\t")

	os.WriteFile("data/hashtags.json", hashtags_fmt, 0644)
	os.WriteFile("data/campaigns.json", campaigns_fmt, 0644)

	// Sort slices
	sort.Strings(new_campaigns)
	sort.Strings(new_hashtags)

	// Commit message
	commit_file, err := os.Create("commit_msg")
	defer commit_file.Close()

	if err != nil {
		log.Fatal(err)
	}

	w := bufio.NewWriter(commit_file)

	campaign_suffix := "s"
	if len(new_campaigns) <= 1 {
		campaign_suffix = ""
	}

	hashtag_suffix := "s"
	if len(new_hashtags) <= 1 {
		hashtag_suffix = ""
	}

	// Commit Message
	fmt.Fprintf(
		w, "Added %d new campaign%s and %d new hashtag%s\n",
		len(new_campaigns), campaign_suffix,
		len(new_hashtags), hashtag_suffix,
	)

	// Campaign List
	if len(new_campaigns) > 0 {
		fmt.Fprintln(w, "Campaigns")
		for _, c := range new_campaigns {
			fmt.Fprintln(w, "  -", c)
		}
	}

	// Hashtag List
	if len(new_hashtags) > 0 {
		fmt.Fprintln(w, "Hashtags")
		for _, h := range new_hashtags {
			fmt.Fprintf(w, "  - #%s\n", h)
		}
	}
	// Write Changes to file
	w.Flush()
}
