// SPDX-License-Identifier: MIT

pragma solidity >0.5.0 <0.9.0;

library LibSet_uint256 {
    struct set {
        uint256[] values;
        mapping(uint256 => uint256) indexes;
    }

    function length(set storage _set) internal view returns (uint256) {
        return _set.values.length;
    }

    function at(set storage _set, uint256 _index) internal view returns (uint256) {
        return _set.values[_index - 1];
    }

    function indexOf(set storage _set, uint256 _value) internal view returns (uint256) {
        return _set.indexes[_value];
    }

    function contains(set storage _set, uint256 _value) internal view returns (bool) {
        return indexOf(_set, _value) != 0;
    }

    function content(set storage _set) internal view returns (uint256[] memory) {
        return _set.values;
    }

    function add(set storage _set, uint256 _value) internal returns (bool) {
        if (contains(_set, _value)) {
            return false;
        }
        _set.values.push(_value);
        _set.indexes[_value] = _set.values.length;
        return true;
    }

    function remove(set storage _set, uint256 _value) internal returns (bool) {
        if (!contains(_set, _value)) {
            return false;
        }

        uint256 i = indexOf(_set, _value);
        uint256 last = length(_set);

        if (i != last) {
            uint256 swapValue = _set.values[last - 1];
            _set.values[i - 1] = swapValue;
            _set.indexes[swapValue] = i;
        }

        delete _set.indexes[_value];
        _set.values.pop();

        return true;
    }

    function clear(set storage _set) internal returns (bool) {
        for (uint256 i = _set.values.length; i > 0; --i) {
            delete _set.indexes[_set.values[i - 1]];
        }
        _set.values = new uint256[](0);
        return true;
    }
}
