import unittest
from j1939 import decode_dm1

class TestDM1(unittest.TestCase):
    def test_one_fault(self):
        result = decode_dm1(bytes.fromhex('00 00 6E 00 03 01'))
        self.assertEqual(result['pgn'], 65226)
        self.assertEqual(result['dtcs'][0]['spn'], 110)
        self.assertEqual(result['dtcs'][0]['fmi'], 3)
        self.assertEqual(result['dtcs'][0]['occurrences'], 1)

    def test_no_dtc(self):
        self.assertEqual(decode_dm1(bytes.fromhex('00 00'))['dtcs'], [])
        self.assertEqual(decode_dm1(bytes.fromhex('00 00 FF FF FF FF'))['dtcs'], [])

    def test_invalid_length(self):
        with self.assertRaises(ValueError):
            decode_dm1(bytes.fromhex('00 00 6E'))

if __name__ == '__main__':
    unittest.main()
