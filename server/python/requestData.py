import cloudscraper
import sys


scraper = cloudscraper.create_scraper()  # returns a CloudScraper instance
# Or: scraper = cloudscraper.CloudScraper()  # CloudScraper inherits from requests.Session

URL = sys.argv[1]
#URL = "https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q={%22$match%22:{%22collectionSymbol%22:%22space_runners%22},%22$sort%22:{%22takerAmount%22:1,%22createdAt%22:-1},%22$skip%22:0}"

r = scraper.get(URL).text

print(r)

scraper.close()

