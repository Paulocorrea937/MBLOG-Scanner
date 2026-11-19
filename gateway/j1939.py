"""Leitor didático de mensagens J1939 DM1.

Somente decodifica bytes fornecidos pelo usuário. Não abre conexão com veículo,
não transmite mensagens e não apaga falhas. Não faz remontagem TP multi-pacote.
"""
from __future__ import annotations
import json
import sys

SPN_EXAMPLES = {110: 'Temperatura do líquido de arrefecimento', 100: 'Pressão do óleo do motor'}
FMI_EXAMPLES = {
    0: 'Valor acima da faixa normal (mais grave)',
    1: 'Valor abaixo da faixa normal (mais grave)',
    2: 'Dados erráticos, intermitentes ou incorretos',
    3: 'Tensão acima do normal ou curto para alimentação alta',
    4: 'Tensão abaixo do normal ou curto para alimentação baixa',
    5: 'Corrente abaixo do normal ou circuito aberto',
    6: 'Corrente acima do normal ou circuito aterrado',
    9: 'Taxa anormal de atualização',
}


def decode_dm1(payload: bytes) -> dict:
    """Decodifica o conteúdo *já remontado* de uma mensagem DM1 (PGN 65226).

    O header CAN e o protocolo de transporte J1939 não estão incluídos.
    """
    if not isinstance(payload, bytes) or len(payload) < 2:
        raise ValueError('DM1 deve conter ao menos 2 bytes de status das lâmpadas.')
    if (len(payload) - 2) % 4:
        raise ValueError('DTC DM1 incompleto; transporte multipacote não remontado.')
    lamp = payload[0]
    lamps = {
        'mil': lamp & 0b11,
        'stop': (lamp >> 2) & 0b11,
        'amber_warning': (lamp >> 4) & 0b11,
        'protect': (lamp >> 6) & 0b11,
    }
    dtcs = []
    for off in range(2, len(payload), 4):
        a, b, c, d = payload[off:off+4]
        if (a, b, c, d) == (255, 255, 255, 255):
            continue
        spn = a | (b << 8) | ((c >> 5) << 16)
        fmi = c & 0x1F
        dtcs.append({
            'spn': spn, 'fmi': fmi, 'occurrences': d & 0x7F,
            'conversion_method': (d >> 7) & 1,
            'spn_hint': SPN_EXAMPLES.get(spn, 'Consulte a documentação do fabricante'),
            'fmi_hint': FMI_EXAMPLES.get(fmi, 'Consulte a documentação J1939'),
        })
    return {'pgn': 65226, 'lamp_status_codes': lamps, 'dtcs': dtcs,
            'warning': 'Decodificação técnica; interpretação e cobertura por fabricante precisam de validação.'}


def main() -> None:
    if len(sys.argv) != 2:
        print('Uso: python gateway/j1939.py "00 00 6E 00 03 01"')
        raise SystemExit(2)
    try:
        payload = bytes.fromhex(sys.argv[1])
        print(json.dumps(decode_dm1(payload), ensure_ascii=False, indent=2))
    except ValueError as exc:
        print(f'Erro: {exc}', file=sys.stderr)
        raise SystemExit(1)


if __name__ == '__main__':
    main()
