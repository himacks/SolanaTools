import cloudscraper
import sys

scraper = cloudscraper.create_scraper()  # returns a CloudScraper instance
# Or: scraper = cloudscraper.CloudScraper()  # CloudScraper inherits from requests.Session

URL = sys.argv[1]

r = scraper.get(URL).text

print(r)

scraper.close()

