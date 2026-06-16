"""Tests unitaires pour le parsing OSM (sans appel réseau)."""

from osm_fetcher import _normalize_cuisine, _parse_element


class TestNormalizeCuisine:
    def test_french_label_to_slug(self):
        assert _normalize_cuisine("japonaise") == "japanese"
        assert _normalize_cuisine("Italien") == "italian"

    def test_known_english_slug(self):
        assert _normalize_cuisine("thai") == "thai"

    def test_unknown_short_slug_preserved(self):
        assert _normalize_cuisine("peruvian") == "peruvian"

    def test_none_or_empty(self):
        assert _normalize_cuisine(None) is None
        assert _normalize_cuisine("") is None

    def test_semicolon_splits_first_value(self):
        assert _normalize_cuisine("italian;pizza") == "italian"

    def test_too_long_unknown_returns_none(self):
        assert _normalize_cuisine("x" * 40) is None


class TestParseElement:
    def test_parses_node_with_address(self):
        el = {
            "type": "node",
            "id": 999,
            "lat": 47.22,
            "lon": -1.55,
            "tags": {
                "name": "Le Bistrot",
                "cuisine": "french",
                "addr:housenumber": "10",
                "addr:street": "Rue Crébillon",
                "addr:postcode": "44000",
                "addr:city": "Nantes",
                "phone": "+33123456789",
            },
        }
        parsed = _parse_element(el)
        assert parsed is not None
        assert parsed["name"] == "Le Bistrot"
        assert parsed["cuisine"] == "french"
        assert "Rue Crébillon" in parsed["address"]
        assert parsed["city"] == "Nantes"
        assert parsed["source"] == "osm"
        assert parsed["source_id"] == "999"
        assert parsed["is_active"] is True

    def test_parses_way_with_center(self):
        el = {
            "type": "way",
            "id": 100,
            "center": {"lat": 47.21, "lon": -1.56},
            "tags": {"name": "Way Resto", "cuisine": "japanese"},
        }
        parsed = _parse_element(el)
        assert parsed is not None
        assert parsed["latitude"] == 47.21
        assert parsed["longitude"] == -1.56

    def test_returns_none_without_name(self):
        assert _parse_element({"type": "node", "id": 1, "tags": {}}) is None
