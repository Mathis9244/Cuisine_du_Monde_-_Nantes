"""Tests unitaires pour SupabaseWriter (mock HTTP)."""

from unittest.mock import MagicMock, patch

import pytest

from supabase_writer import SupabaseWriter


class TestSupabaseWriter:
    def test_requires_credentials(self):
        with patch.dict("os.environ", {}, clear=True):
            with pytest.raises(RuntimeError, match="SUPABASE_URL"):
                SupabaseWriter()

    def test_upsert_empty_returns_zero(self):
        writer = SupabaseWriter(url="https://test.supabase.co", service_role_key="key")
        assert writer.upsert([]) == 0

    @patch("supabase_writer.requests.post")
    def test_upsert_posts_to_rest_endpoint(self, mock_post: MagicMock):
        mock_post.return_value.status_code = 201
        mock_post.return_value.json.return_value = [{"id": 1}]

        writer = SupabaseWriter(url="https://test.supabase.co", service_role_key="secret")
        count = writer.upsert(
            [{"name": "Test", "source": "osm", "source_id": "1", "is_active": True}]
        )

        assert count == 1
        mock_post.assert_called_once()
        url = mock_post.call_args[0][0]
        assert "/rest/v1/restaurants" in url
        assert "on_conflict=source,source_id" in url
        headers = mock_post.call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer secret"

    @patch("supabase_writer.requests.post")
    def test_upsert_raises_on_http_error(self, mock_post: MagicMock):
        mock_post.return_value.status_code = 500
        mock_post.return_value.text = "error"

        writer = SupabaseWriter(url="https://test.supabase.co", service_role_key="key")
        with pytest.raises(RuntimeError, match="500"):
            writer.upsert([{"name": "X", "source": "osm", "source_id": "1"}])
