const jsonTest = {
    "id": "resp_68ab3249832481909370278680f301d106d1651a196f46e4",
    "object": "response",
    "created_at": 1756049993,
    "status": "completed",
    "background": false,
    "error": null,
    "incomplete_details": null,
    "instructions": null,
    "max_output_tokens": null,
    "max_tool_calls": null,
    "model": "gpt-5-mini-2025-08-07",
    "output": [
        {
            "id": "rs_68ab324a984481908a08816896fdbd2506d1651a196f46e4",
            "type": "reasoning",
            "summary": []
        },
        {
            "id": "ws_68ab32604d708190a714d6e3adb937f306d1651a196f46e4",
            "type": "web_search_call",
            "status": "completed",
            "action": {
                "type": "search",
                "query": "ISO/TS 15066 2016 iso.org standard page"
            }
        },
        {
            "id": "rs_68ab3264bbb081908f4b2b5cf153e4a506d1651a196f46e4",
            "type": "reasoning",
            "summary": []
        },
        {
            "id": "ws_68ab3269098481908552f62d46ce9ea206d1651a196f46e4",
            "type": "web_search_call",
            "status": "completed",
            "action": {
                "type": "search",
                "query": "ISO 10218-1 2011 iso.org standard page '10218-1' 'robots' 'safety requirements' "
            }
        },
        {
            "id": "rs_68ab326d9a048190bf35bbd6082eb9f006d1651a196f46e4",
            "type": "reasoning",
            "summary": []
        },
        {
            "id": "ws_68ab326e7bf08190b77be5717a22408c06d1651a196f46e4",
            "type": "web_search_call",
            "status": "completed",
            "action": {
                "type": "search",
                "query": "IEC 61508 webstore.iec.ch 'IEC 61508' functional safety standard"
            }
        },
        {
            "id": "rs_68ab3271fb3881909154e18425524b7b06d1651a196f46e4",
            "type": "reasoning",
            "summary": []
        },
        {
            "id": "ws_68ab3272e9f88190a88267ae6f7925a806d1651a196f46e4",
            "type": "web_search_call",
            "status": "completed",
            "action": {
                "type": "search",
                "query": "ISO 10218-2:2025 iso.org standard page '10218-2 2025' "
            }
        },
        {
            "id": "rs_68ab3276af508190aa6f28ee57376fde06d1651a196f46e4",
            "type": "reasoning",
            "summary": []
        },
        {
            "id": "msg_68ab328140488190a7783bfab5562e7406d1651a196f46e4",
            "type": "message",
            "status": "completed",
            "content": [
                {
                    "type": "output_text",
                    "annotations": [],
                    "logprobs": [],
                    "text": "{\"results\":[{\"iso_number\":\"ISO/TS 15066:2016\",\"title\":\"Robots and robotic devices — Collaborative robots (Technical Specification)\",\"reason\":\"Direct, application‑level guidance for collaborative robot operation. Defines collaborative techniques (including monitored stop / monitored standstill, speed & separation monitoring, and power/force limiting) and explicitly includes requirements and guidance for stopping functions and the design of the collaborative workspace when a human enters the work area.\",\"links\":[\"https://www.iso.org/standard/62996.html\"]},{\"iso_number\":\"ISO 10218-2:2025\",\"title\":\"Robotics — Safety requirements — Part 2: Industrial robot applications and robot cells\",\"reason\":\"System/integration level requirements for robot applications and cells. Covers protective measures, design of the collaborative workspace, stopping functions and the integration/validation of safety functions that cause the robot to stop or transition when a person enters the work area.\",\"links\":[\"https://www.iso.org/standard/73934.html\"]},{\"iso_number\":\"ISO 10218-1:2025\",\"title\":\"Robotics — Safety requirements — Part 1: Industrial robots\",\"reason\":\"Specifies safety requirements for the robot itself (inherent safe design and required safety functions). Relevant for manufacturer‑provided stop functions and safe states the robot must assume when humans are present in its workspace.\",\"links\":[\"https://www.iso.org/standard/73933.html\"]},{\"iso_number\":\"ISO 12100:2010\",\"title\":\"Safety of machinery — General principles for design — Risk assessment and risk reduction\",\"reason\":\"Establishes the risk assessment and risk reduction methodology used to determine when protective measures (such as stopping the robot when a human enters the work area) are required and how to select/verify such measures.\",\"links\":[\"https://www.iso.org/standard/51528.html\"]},{\"iso_number\":\"ISO 13849-1:2023\",\"title\":\"Safety of machinery — Safety-related parts of control systems — Part 1: General principles for design\",\"reason\":\"Governs the design and required performance (Performance Level, PL) of safety‑related control functions. The ‘stop when person enters area’ is a safety function implemented by SRP/CS and ISO 13849-1 is used to specify required PL, structure and validation of that stop function.\",\"links\":[\"https://www.iso.org/cms/render/live/en/sites/isoorg/contents/data/standard/07/34/73481.html\"]},{\"iso_number\":\"IEC 62061:2021 (Consolidated)\",\"title\":\"Safety of machinery — Functional safety of safety‑related control systems\",\"reason\":\"Machinery‑sector functional safety standard (IEC 61508 sector standard). Provides procedures and requirements (SIL / architectures / verification) for safety‑related control systems that perform safety functions such as stopping the robot when a person enters the work area.\",\"links\":[\"https://webstore.iec.ch/en/publication/59927\",\"https://webstore.iec.ch/en/publication/93654\"]},{\"iso_number\":\"IEC 61508 (series)\",\"title\":\"Functional safety of electrical/electronic/programmable electronic safety‑related systems (series)\",\"reason\":\"Foundational functional safety framework (safety lifecycle, SIL concepts) used as the basis for machinery sector standards (e.g., IEC 62061). Relevant where the stop function is implemented using E/E/PE control systems and a full functional‑safety lifecycle is applied.\",\"links\":[\"https://webstore.iec.ch/en/publication/5515\"]}]}"
                }
            ],
            "role": "assistant"
        }
    ],
    "parallel_tool_calls": true,
    "previous_response_id": null,
    "prompt_cache_key": null,
    "reasoning": {
        "effort": "medium",
        "summary": null
    },
    "safety_identifier": null,
    "service_tier": "default",
    "store": true,
    "temperature": 1,
    "text": {
        "format": {
            "type": "json_schema",
            "description": "Match safety requirements to ISO/IEC standards",
            "name": "iso_standard_matching",
            "schema": {
                "type": "object",
                "properties": {
                    "results": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "iso_number": {
                                    "type": "string"
                                },
                                "title": {
                                    "type": "string"
                                },
                                "reason": {
                                    "type": "string"
                                },
                                "links": {
                                    "type": "array",
                                    "items": {
                                        "type": "string"
                                    },
                                    "minItems": 1
                                }
                            },
                            "required": [
                                "iso_number",
                                "title",
                                "reason",
                                "links"
                            ],
                            "additionalProperties": false
                        }
                    }
                },
                "required": [
                    "results"
                ],
                "additionalProperties": false
            },
            "strict": true
        },
        "verbosity": "medium"
    },
    "tool_choice": "auto",
    "tools": [
        {
            "type": "web_search_preview",
            "search_context_size": "low",
            "user_location": {
                "type": "approximate",
                "city": null,
                "country": "US",
                "region": null,
                "timezone": null
            }
        }
    ],
    "top_logprobs": 0,
    "top_p": 1,
    "truncation": "disabled",
    "usage": {
        "input_tokens": 69667,
        "input_tokens_details": {
            "cached_tokens": 51584
        },
        "output_tokens": 3999,
        "output_tokens_details": {
            "reasoning_tokens": 3264
        },
        "total_tokens": 73666
    },
    "user": null,
    "metadata": {}
};

export default jsonTest;