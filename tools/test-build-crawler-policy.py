import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("crawler_policy", Path(__file__).with_name("build-crawler-policy.py"))
policy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy)

class CrawlerPolicyTests(unittest.TestCase):
    def test_canonical_public_cidrs_only(self):
        valid = {"prefixes": [{"ipv4Prefix": "66.249.64.0/19"}, {"ipv6Prefix": "2001:4860:4801:10::/64"}]}
        self.assertEqual(policy.checked_prefixes(valid), ["66.249.64.0/19", "2001:4860:4801:10::/64"])
        for row in [{"ipv4Prefix": "66.249.64.1/19"}, {"ipv4Prefix": "127.0.0.1/32"}, {"ipv4Prefix": "0.0.0.0/0"}, {"ipv6Prefix": "::/0"}, {"ipv6Prefix": "2001:4860:4801:0010::/64"}, {"ipv6Prefix": "66.249.64.0/19"}, {"ipv4Prefix": "66.249.64.0/19", "extra": "unreviewed"}]:
            with self.assertRaises(ValueError):
                policy.checked_prefixes({"prefixes": [row]})

    def test_exact_ranges_are_chunked_without_a_ua_only_exception(self):
        prefixes = [f"66.249.64.{i}/32" for i in range(150)]
        rules = policy.build_rules([{"prefixes": prefixes, "uaPattern": "Googlebot"}], {"valuesPerCondition": 75, "groupsPerRule": 25, "conditionsPerGroup": 65})
        self.assertEqual(len(rules), 2)
        groups = rules[0]["conditionGroup"]
        self.assertEqual(len(groups), 2)
        for group in groups:
            conditions = {condition["type"]: condition for condition in group["conditions"]}
            self.assertEqual(conditions["method"]["value"], ["GET", "HEAD"])
            self.assertEqual(conditions["environment"]["value"], "production")
            self.assertIn("user_agent", conditions)
            self.assertLessEqual(len(conditions["ip_address"]["value"]), 75)
            self.assertTrue(conditions["raw_path"]["neg"])
        self.assertEqual([prefix for group in groups for condition in group["conditions"] if condition["type"] == "ip_address" for prefix in condition["value"]], prefixes)

    def test_never_silently_truncates_for_schema_limits(self):
        with self.assertRaises(ValueError):
            policy.build_rules([{"prefixes": [f"66.249.64.{i}/32" for i in range(76)], "uaPattern": "Googlebot"}], {"valuesPerCondition": 75, "groupsPerRule": 1, "conditionsPerGroup": 65})

    def test_only_fixed_official_https_sources_are_readable(self):
        for url in ["http://openai.com/searchbot.json", "https://evil.example/ranges.json", "https://openai.com/searchbot.json?override=1"]:
            with self.assertRaises(ValueError):
                policy.fetch_public(url, 1000)

if __name__ == "__main__":
    unittest.main()
